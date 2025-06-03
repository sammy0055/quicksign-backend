const taskService = require("../services/task.service");
const notificationService = require("../services/notification.service");
const groupService = require("../services/group.service");
const generateTaskToken = require("../helpers/generateTaskToken");
const renderTemplate = require("../helpers/renderTemplate");
const sendMail = require("../helpers/sendMail");
require("dotenv").config();
const path = require("path");
var fs = require("fs");
const fsp = require("fs").promises;
const { Client, Task } = require("../models");
require("structured-clone-polyfill");
const submissionService = require("../services/submission.service");
const whatsappUtilInstance = require("../utils/whatsAppUtil");
const UserService = require("../services/user.service");
const db = require("../models");
const {
  addEditedPdfFile,
  downloadPdfFileWithPath,
  replaceEditedPdf,
} = require("../helpers/manage-fileAndfolder");
const { v4: uuidv4 } = require("uuid");

function getClientName(client, lang = "en") {
  const name = client?.name || client?.email || client?.phone;
  const defaultName = lang === "he" ? "לקוח" : "a client";
  return name || defaultName;
}

exports.getAllTasks = async (req, res) => {
  try {
    const { limit, offset, filters } = req.body;
    const tasks = await taskService.getAllTasks(
      limit,
      offset,
      filters,
      req.userId
    );
    res.status(200).json({ data: tasks });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const taskId = req.body.id;
    const task = await taskService.getTaskById(taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.status(200).json({ data: task });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

exports.getTaskPdf = async (req, res) => {
  try {
    const fileUrl = req.query.filePath;
    if (!fileUrl) {
      return res.status(400).json({ error: "filePath is required" });
    }
    const data = await downloadPdfFileWithPath(fileUrl);
    // 2. Convert Blob to Buffer
    const buffer = Buffer.from(await data.arrayBuffer());
    res.setHeader("Content-Type", "application/pdf");
    res.send(buffer);
  } catch (error) {
    console.error("Error in getTaskPdf:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getAllSavedPdfInfo = async (req, res) => {
  try {
    const userId = req.userId.toString();

    // Get all tasks from database for this user
    const tasks = await Task.findAll({
      where: {
        userId: userId,
        isSaved: true,
        isDeleted: false,
      },
      attributes: ["id", "documentName", "status", "fileUrl", "createdAt"],
    });

    // Map tasks to response format
    const documents = tasks.map((task) => ({
      id: task.id,
      documentName: task.documentName,
      status: task.status,
      createdAt: task.createdAt,
      fileUrl: process.env.URL + task.fileUrl,
      thumbnailUrl:
        process.env.URL +
        task.fileUrl
          .replace(/\.pdf$/i, ".jpg")
          .replace(/taskPdfs/, "taskPdfs/thumbs"),
    }));

    res.status(200).json({
      data: documents.filter((doc) => doc.fileUrl), // Filter out entries without files
    });
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.createTask = async (req, res) => {
  try {
    const lang = req.query.lang;
    const data = JSON.parse(req.body.data);
    const isClientListEmpty = data?.clientList?.length === 0;
    const isGroupListEmpty = data?.groupList?.length === 0;
    const isAdditionalListEmpty = data?.additionalContactList?.length === 0;
    // Validate client or group selection

    if (isClientListEmpty && isAdditionalListEmpty && isGroupListEmpty) {
      throw new Error(
        "Please choose at least one client or group to send the task to."
      );
    }

    const user = await UserService.findOne({
      where: { id: req.userId },
    });

    if (!user) throw new Error("user is not valid");
    const comapny = await db.Company.findByPk(user.companyId);
    if (!comapny) throw new Error("no organization for this user");
    // Check documentLimit before creating the task
    if (comapny.documentLimit === 0)
      throw new Error(
        "Document limit reached. Please upgrade your plan to create more tasks."
      );

    const { path } = await addEditedPdfFile(req.file);
    data.clientList.forEach((item) => {
      if (!item.id) item.id = uuidv4();
    });
    // Map data for task creation
    const mappedData = {
      documentName: data.documentName,
      additionalNote: data.additionalNote,
      channel: data.sendingChannel,
      userId: data.id || req.userId,
      fileUrl: path,
      isSaved: false, // Add isReusable to the task data
      clientIds: Array.isArray(data?.clientList)
        ? data.clientList.map((c) => c.id)
        : [],
      clientList: data?.clientList || [],
      groupIds: Array.isArray(data?.groupList)
        ? data.groupList.map((g) => g.id)
        : [],
      confirmationEmail: data.confirmationEmail,
      signatureRoutine: data.sequentialRoutine
        ? "sequential"
        : data.parallelRoutine
        ? "parallel"
        : undefined,
      additionalContactList: data?.additionalContactList,
      companyId: user.companyId,
      lang: lang,
    };

    const task = await taskService.createTask(mappedData);

    // Collect all clients
    let allClients = [];
    data.clientList.forEach((client) => allClients.push(client));

    // Deduplicate by client.id
    const uniqueClientsMap = {};
    allClients.forEach((client) => {
      if (client.id) uniqueClientsMap[client.id] = client;
    });
    const uniqueClients = Object.values(uniqueClientsMap);

    // Send notifications based on channel --------------------------
    if (data.sendingChannel === "email") {
      for (const client of uniqueClients) {
        if (client.email) {
          const token = generateTaskToken({
            taskId: task.id,
            email: client.email,
            clientId: client.id,
          });
          const url = `${process.env.ANGULARURL}/document-sign?token=${token}`;
          const templateData = {
            clientName: client.name || client.email.split("@")[0],
            documentName: data.documentName,
            additionalNote: data.additionalNote,
            url,
          };
          const notificationMessage = {
            en: `Document sent to ${
              client.name || client.email.split("@")[0]
            } via email`,
            he: `המסמך נשלח אל ${client.name || client.phone} דרך email`,
          };

          const taskMsgTitle =
            lang === "en"
              ? `New Task Assigned: ${task.documentName}`
              : `משימה חדשה הוקצתה: ${task.documentName}`;
          const htmlContent = await renderTemplate(
            "task-email.html",
            templateData
          );
          await sendMail(client.email, taskMsgTitle, htmlContent);
          await notificationService.createNotification({
            userId: req.userId,
            type: "documentSent",
            message:
              lang === "en" ? notificationMessage.en : notificationMessage.he,
            taskId: task.id,
            clientName: client.name || client.email.split("@")[0],
          });
        }
      }
    }

    // phone represent whatsapp channel 😁
    if (data.sendingChannel === "phone") {
      for (const client of uniqueClients) {
        if (client.phone) {
          const token = generateTaskToken({
            taskId: task.id,
            clientId: client.id,
          });
          const signUrl = `${process.env.ANGULARURL}/document-sign?token=${token}`;
          const recipient = {
            phone: client.phone,
            name: client?.name || "there",
          };
          const document = {
            name: data.documentName,
            note: data.additionalNote,
          };
          await whatsappUtilInstance.sendDocumentSignRequest(
            recipient,
            document,
            signUrl,
            lang
          );

          const notificationMessage = {
            en: `Document sent to ${client.name || client.phone} via whatsapp`,
            he: `המסמך נשלח אל ${client.name || client.phone} דרך whatsapp`,
          };
          await notificationService.createNotification({
            userId: req.userId,
            type: "documentSent",
            message:
              lang === "en" ? notificationMessage.en : notificationMessage.he,
            taskId: task.id,
            clientName: client.name || client.phone,
          });
        }
      }
    }

    if (data.sendingChannel === "browser") {
      return res.status(500).json({
        error:
          "Browser channel is not supported yet. Please use email or phone.",
      });
    }

    res
      .status(201)
      .json({ message: "Task created and notifications sent!", data: task });
  } catch (error) {
    console.error("Error in createTask:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.downloadTaskPdfFile = async (req, res) => {
  try {
    const path = req.query.fileUrl;
    const data = await downloadPdfFileWithPath(path);
    const buffer = Buffer.from(await data.arrayBuffer());

    // 3. Set headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    // res.setHeader("Content-Disposition", "attachment; filename=myfile.pdf");
    res.end(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const data = JSON.parse(req.body.data);
    const task = await taskService.updateTask(taskId, data);
    res.status(200).json({ data: task });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    await taskService.deleteTask(taskId);
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

exports.openTask = async (req, res) => {
  try {
    const { taskId, clientId } = req.body;

    if (!taskId || !clientId) {
      return res
        .status(400)
        .json({ error: "Task ID and Client ID are required." });
    }

    // Check if the client already submitted the task
    const existingSubmission =
      await submissionService.getSubmissionByTaskAndClient(taskId, clientId);

    if (existingSubmission) {
      return res.status(200).json({
        status: "signed",
        data: null,
      });
    }

    // Update the task status to "opened" if it's still "pending"
    const task = await taskService.getTaskById(taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found." });
    }

    if (task.status === "sent") {
      // Update the task status using updateTask
      await taskService.updateTask(taskId, { status: "opened" });

      // Fetch client details for the notification
      const client = await Client.findByPk(clientId);
      const clientName = getClientName(client, task?.lang);

      // Create notification for the task creator
      await notificationService.createNotification({
        userId: task.userId, // Assumes task has userId (the creator)
        type: "taskOpened",
        message:
          task?.lang === "he"
            ? `המשימה "${task.documentName}" נפתחה על ידי ${getClientName(
                client,
                task?.lang
              )}`
            : `Task "${task.documentName}" has been opened by ${getClientName(
                client,
                task?.lang
              )}`,
        taskId: task.id,
        clientName: clientName,
      });
    }

    // Return the updated task
    const updatedTask = await taskService.getTaskById(taskId);
    return res.status(200).json({
      status: updatedTask.status,
      data: updatedTask,
    });
  } catch (error) {
    console.error("Error in openTask:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.submitTask = async (req, res) => {
  try {
    // Retrieve fields from the form data
    const { taskId, clientId, clientEmail } = req.body;
    if (!taskId || !clientId) {
      return res
        .status(400)
        .json({ error: "Task ID and Client ID are required." });
    }

    // Ensure the edited PDF file is provided by Multer
    const editedFile = req.file;
    if (!editedFile) {
      return res.status(400).json({ error: "Edited PDF file is required." });
    }

    // Normalize file path
    // const filePath = req.file.path.replace(/\\/g, "/");

    // Check if this client has already submitted for this task
    const existingSubmission =
      await submissionService.getSubmissionByTaskAndClient(taskId, clientId);
    if (existingSubmission) {
      return res
        .status(400)
        .json({ error: "You have already submitted this task." });
    }

    // Create a new submission record for this client
    const task = await db.Task.findByPk(taskId);
    if (!task) throw new Error("task does not exist");
    const { path } = await replaceEditedPdf(task.fileUrl, editedFile);
    await submissionService.createSubmission({
      taskId,
      clientId,
      fileUrl: path,
      submittedAt: new Date(),
    });

    // Optionally, update overall task status if necessary (for instance, check if all assigned clients have submitted)

    // Retrieve the task for notification details
    const updatedTask = await taskService.getTaskById(taskId);
    const taskSubmissions = await submissionService.getAllSubmissionsByTask(
      taskId
    );

    const hasAllclientsSubmitted = updatedTask?.clientList?.every((client) => {
      return taskSubmissions?.some((submission) => {
        return submission?.clientId === client?.id;
      });
    });

    if (hasAllclientsSubmitted) {
      await taskService.updateTask(taskId, { status: "signed" });
    }

    if (!updatedTask) {
      return res
        .status(404)
        .json({ error: "Task not found after submission." });
    }

    // Retrieve client information using clientId to get the client's name
    const client = await Client.findByPk(clientId);
    const clientName = getClientName(client);

    // Create a notification for the admin/manager who sent the task
    await notificationService.createNotification({
      userId: updatedTask.userId, // Admin/manager's user ID from the task record
      type: "Task Submission",
      message:
        task.lang === "he"
          ? `הלקוח (${getClientName(client, task?.lang)}) שלח מסמך חתום עבור "${
              updatedTask.documentName
            }"`
          : `Client (${getClientName(
              client,
              task?.lang
            )}) has submitted a signed document for "${
              updatedTask.documentName
            }".`,
      taskId: updatedTask.id,
      clientName: clientName,
    });

    return res.status(200).json({ message: "Task submitted successfully." });
  } catch (error) {
    console.error("Error in submitTask:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.getDashboardData = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const dashboardData = await taskService.getDashboardData(
      startDate,
      endDate,
      req.userId
    );
    res.status(200).json({ data: dashboardData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

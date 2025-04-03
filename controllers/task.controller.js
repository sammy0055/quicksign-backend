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
const { generatePdfThumbnail } = require("../utils/pdfThumbnail");
const { Client, Task } = require("../models");
require("structured-clone-polyfill");
const submissionService = require("../services/submission.service");
const whatsappUtilInstance = require("../utils/whatsAppUtil");
const UserService = require("../services/user.service");

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

exports.getTaskPdf = (req, res) => {
  try {
    if (!req.query.filePath) {
      return res.status(400).json({ error: "filePath is required" });
    }
    const filePath = decodeURIComponent(req.query.filePath);
    const fullPath = path.join(__dirname, "../", filePath);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: "File not found" });
    }

    res.setHeader("Content-Type", "application/pdf");
    fs.readFile(fullPath, (err, data) => {
      if (err) {
        console.error("Read error:", err);
        return res.status(500).json({ error: "Failed to read file" });
      }
      res.send(data);
    });
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

// exports.createTask = async (req, res) => {
//   try {
//     const data = JSON.parse(req.body.data);

//     // Validate client or group selection
//     if (
//       (!data.clientList || data.clientList.length === 0) &&
//       (!data.groupList || data.groupList.length === 0)
//     ) {
//       return res.status(400).json({
//         error:
//           "Please choose at least one client or group to send the task to.",
//       });
//     }

//     // File handling
//     const fileUrl = path
//       .join(
//         "uploads",
//         req.userId.toString(),
//         "taskPdfs",
//         path.basename(req.file.path)
//       )
//       .replace(/\\/g, "/");
//     const filePath = path.join(__dirname, "../", fileUrl);
//     const fileDir = path.dirname(filePath);
//     const thumbsDir = path.join(fileDir, "thumbs");

//     // Map data for task creation
//     const mappedData = {
//       documentName: data.documentName,
//       additionalNote: data.additionalNote,
//       channel: data.sendingChannel,
//       userId: data.id || req.userId,
//       fileUrl,
//       clientIds: Array.isArray(data.clientList)
//         ? data.clientList.map((c) => c.id)
//         : [],
//       groupIds: Array.isArray(data.groupList)
//         ? data.groupList.map((g) => g.id)
//         : [],
//       confirmationEmail: data.confirmationEmail,
//       signatureRoutine: data.sequentialRoutine
//         ? "sequential"
//         : data.parallelRoutine
//         ? "parallel"
//         : undefined,
//     };

//     const task = await taskService.createTask(mappedData);

//     // Collect all clients
//     let allClients = [];
//     data.clientList.forEach((client) => allClients.push(client));
//     for (const group of data.groupList) {
//       const groupClients = await groupService.getClientsFromGroup(group.id);
//       allClients.push(...groupClients);
//     }

//     // Deduplicate by client.id
//     const uniqueClientsMap = {};
//     allClients.forEach((client) => {
//       if (client.id) uniqueClientsMap[client.id] = client;
//     });
//     const uniqueClients = Object.values(uniqueClientsMap);

//     // Send notifications based on channel
//     if (data.sendingChannel === "email") {
//       for (const client of uniqueClients) {
//         if (client.email) {
//           const token = generateTaskToken({
//             taskId: task.id,
//             email: client.email,
//             clientId: client.id,
//           });
//           const url = `${process.env.ANGULARURL}/document-sign?token=${token}`;
//           const templateData = {
//             clientName: client.name || client.email.split("@")[0],
//             documentName: data.documentName,
//             additionalNote: data.additionalNote,
//             url,
//           };
//           const htmlContent = await renderTemplate(
//             "task-email.html",
//             templateData
//           );
//           await sendMail(
//             client.email,
//             `New Task Assigned: ${task.documentName}`,
//             htmlContent
//           );
//           await notificationService.createNotification({
//             userId: req.userId,
//             type: "documentSent",
//             message: `Document sent to ${
//               client.name || client.email.split("@")[0]
//             } via email`,
//             taskId: task.id,
//             clientName: client.name || client.email.split("@")[0],
//           });
//         } else {
//         }
//       }
//     } else if (data.sendingChannel === "sms") {
//       for (const client of uniqueClients) {
//         if (client.phone) {
//           const token = generateTaskToken({
//             taskId: task.id,
//             clientId: client.id,
//           });
//           const signUrl = `${process.env.ANGULARURL}/document-sign?token=${token}`;
//           const recipient = {
//             phone: client.phone,
//             name: client.name || "there",
//           };
//           const document = {
//             name: data.documentName,
//             note: data.additionalNote,
//           };

//           await whatsappUtilInstance.sendDocumentSignRequest(
//             recipient,
//             document,
//             signUrl
//           );
//           await notificationService.createNotification({
//             userId: req.userId,
//             type: "documentSent",
//             message: `Document sent to ${client.name || client.phone} via SMS`,
//             taskId: task.id,
//             clientName: client.name || client.phone,
//           });
//         } else {
//         }
//       }
//     }

//     // Handle thumbnails for reusable tasks
//     if (data.isReusable) {
//       try {
//         const thumbName = `${path.parse(filePath).name}.jpg`;
//         const thumbPath = path.join(thumbsDir, thumbName);
//         await fsp.mkdir(thumbsDir, { recursive: true });
//         await generatePdfThumbnail(filePath, thumbPath);
//       } catch (error) {
//         console.error("Thumbnail generation failed:", error);
//       }
//     }

//     // Delete file if not reusable
//     if (!data.isReusable) {
//       await fsp
//         .unlink(req.file.path)
//         .catch((err) => console.error("Error deleting file:", err));
//     }

//     res
//       .status(201)
//       .json({ message: "Task created and notifications sent!", data: task });
//   } catch (error) {
//     console.error("Error in createTask:", error);
//     if (
//       error ===
//       "Document limit reached. Please upgrade your plan to create more tasks."
//     ) {
//       return res.status(403).json({ message: error });
//     }
//     res.status(500).json({ error: error.message });
//   }
// };

exports.createTask = async (req, res) => {
  try {
    const data = JSON.parse(req.body.data);

    // Validate client or group selection
    if (
      (!data.clientList || data.clientList.length === 0) &&
      (!data.groupList || data.groupList.length === 0)
    ) {
      return res.status(400).json({
        error:
          "Please choose at least one client or group to send the task to.",
      });
    }

    // File handling
    const isReusable = data.isReusable || false;
    const folder = isReusable ? "taskPdfs" : "tempTaskPdfs";
    const fileUrl = path
      .join(
        "uploads",
        req.userId.toString(),
        folder,
        path.basename(req.file.path)
      )
      .replace(/\\/g, "/");
    const filePath = path.join(__dirname, "../", fileUrl);
    const fileDir = path.dirname(filePath);
    const thumbsDir = path.join(fileDir, "thumbs");

    // Map data for task creation
    const mappedData = {
      documentName: data.documentName,
      additionalNote: data.additionalNote,
      channel: data.sendingChannel,
      userId: data.id || req.userId,
      fileUrl,
      isSaved: isReusable ? true : false, // Add isReusable to the task data
      clientIds: Array.isArray(data.clientList)
        ? data.clientList.map((c) => c.id)
        : [],
      groupIds: Array.isArray(data.groupList)
        ? data.groupList.map((g) => g.id)
        : [],
      confirmationEmail: data.confirmationEmail,
      signatureRoutine: data.sequentialRoutine
        ? "sequential"
        : data.parallelRoutine
        ? "parallel"
        : undefined,
    };

    // Check documentLimit before creating the task
    const user = await UserService.findOne({
      where: { id: mappedData.userId },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    if (user.documentLimit === 0) {
      return res.status(403).json({
        message:
          "Document limit reached. Please upgrade your plan to create more tasks.",
      });
    }

    const task = await taskService.createTask(mappedData);

    // Collect all clients
    let allClients = [];
    data.clientList.forEach((client) => allClients.push(client));
    for (const group of data.groupList) {
      const groupClients = await groupService.getClientsFromGroup(group.id);
      allClients.push(...groupClients);
    }

    // Deduplicate by client.id
    const uniqueClientsMap = {};
    allClients.forEach((client) => {
      if (client.id) uniqueClientsMap[client.id] = client;
    });
    const uniqueClients = Object.values(uniqueClientsMap);

    // Send notifications based on channel
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
          const htmlContent = await renderTemplate(
            "task-email.html",
            templateData
          );
          await sendMail(
            client.email,
            `New Task Assigned: ${task.documentName}`,
            htmlContent
          );
          await notificationService.createNotification({
            userId: req.userId,
            type: "documentSent",
            message: `Document sent to ${
              client.name || client.email.split("@")[0]
            } via email`,
            taskId: task.id,
            clientName: client.name || client.email.split("@")[0],
          });
        } else {
        }
      }
    } else if (data.sendingChannel === "sms") {
      for (const client of uniqueClients) {
        if (client.phone) {
          const token = generateTaskToken({
            taskId: task.id,
            clientId: client.id,
          });
          const signUrl = `${process.env.ANGULARURL}/document-sign?token=${token}`;
          const recipient = {
            phone: client.phone,
            name: client.name || "there",
          };
          const document = {
            name: data.documentName,
            note: data.additionalNote,
          };
          await whatsappUtilInstance.sendDocumentSignRequest(
            recipient,
            document,
            signUrl
          );
          await notificationService.createNotification({
            userId: req.userId,
            type: "documentSent",
            message: `Document sent to ${client.name || client.phone} via SMS`,
            taskId: task.id,
            clientName: client.name || client.phone,
          });
        } else {
        }
      }
    }

    // Handle thumbnails for reusable tasks
    if (data.isReusable) {
      try {
        const thumbName = `${path.parse(filePath).name}.jpg`;
        const thumbPath = path.join(thumbsDir, thumbName);
        await fsp.mkdir(thumbsDir, { recursive: true });
        await generatePdfThumbnail(filePath, thumbPath);
      } catch (error) {
        console.error("Thumbnail generation failed:", error);
      }
    }

    // Removed immediate deletion for non-reusable tasks
    // if (!data.isReusable) {
    //   await fsp.unlink(req.file.path).catch((err) => console.error("Error deleting file:", err));
    // }

    res
      .status(201)
      .json({ message: "Task created and notifications sent!", data: task });
  } catch (error) {
    console.error("Error in createTask:", error);
    res.status(500).json({ error: error.message });
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
      const clientName = client
        ? client.name || client.email || client.phone
        : "a client";

      // Create notification for the task creator
      await notificationService.createNotification({
        userId: task.userId, // Assumes task has userId (the creator)
        type: "taskOpened",
        message: `Task "${task.documentName}" has been opened by ${clientName}`,
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
    if (!req.file) {
      return res.status(400).json({ error: "Edited PDF file is required." });
    }

    // Normalize file path
    const filePath = req.file.path.replace(/\\/g, "/");

    // Check if this client has already submitted for this task
    const existingSubmission =
      await submissionService.getSubmissionByTaskAndClient(taskId, clientId);
    if (existingSubmission) {
      return res
        .status(400)
        .json({ error: "You have already submitted this task." });
    }

    // Create a new submission record for this client
    await submissionService.createSubmission({
      taskId,
      clientId,
      fileUrl: filePath,
      submittedAt: new Date(),
    });

    // Optionally, update overall task status if necessary (for instance, check if all assigned clients have submitted)

    // Retrieve the task for notification details
    const updatedTask = await taskService.getTaskById(taskId);
    if (!updatedTask) {
      return res
        .status(404)
        .json({ error: "Task not found after submission." });
    }

    // Retrieve client information using clientId to get the client's name
    const client = await Client.findByPk(clientId);
    const clientName = client && client.name ? client.name : clientEmail;

    // Create a notification for the admin/manager who sent the task
    await notificationService.createNotification({
      userId: updatedTask.userId, // Admin/manager's user ID from the task record
      type: "Task Submission",
      message: `Client (${clientName}) has submitted a signed document for "${updatedTask.documentName}".`,
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

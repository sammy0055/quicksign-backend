const { Task, Client, Group, User } = require("../models"); // Adjust the path as needed
const { Op } = require("sequelize");
const {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addWeeks,
  addMonths,
  format,
  differenceInDays,
  differenceInWeeks,
  differenceInMonths,
  isWithinInterval,
} = require("date-fns");
/**
 * Retrieves tasks with pagination and filtering.
 * @param {number} limit - The maximum number of tasks to return.
 * @param {number} offset - The number of tasks to skip.
 * @param {object} filters - An object with optional filter criteria.
 * @returns {Promise<Array>} List of tasks.
 */
exports.getAllTasks = async (limit, offset, filters, userId) => {
  // Build the where clause based on filters (adjust as needed)
  const whereClause = {
    userId: userId,
  };
  if (filters) {
    if (filters.documentName) {
      whereClause.documentName = { $like: `%${filters.documentName}%` };
    }
    if (filters.status) {
      whereClause.status = filters.status;
    }
    if (filters.channel) {
      whereClause.channel = filters.channel;
    }
    if (filters.userId) {
      whereClause.userId = filters.userId;
    }
  }

  const tasks = await Task.findAndCountAll({
    where: whereClause,
    limit,
    offset,
    include: [
      { model: Client, through: { attributes: [] } },
      { model: Group, through: { attributes: [] } },
      {
        model: User,
        attributes: ["id", "firstName", "lastName", "email"],
      },
    ],
  });

  return tasks;
};

/**
 * Retrieves a single task by its primary key.
 * @param {string} id - The task ID.
 * @returns {Promise<Object>} The task object or null if not found.
 */
exports.getTaskById = async (id) => {
  const task = await Task.findByPk(id, {
    include: [
      { model: Client, through: { attributes: [] } },
      { model: Group, through: { attributes: [] } },
    ],
  });
  return task;
};

/**
 * Creates a new task.
 * @param {object} data - The task data.
 * @returns {Promise<Object>} The created task.
 */
exports.createTask = async (data) => {
  // Create the task record
  console.log("====================================");
  console.log("data", data);
  console.log("====================================");
  const task = await Task.create(data);

  // If associated client IDs are provided, set the associations
  if (data.clientIds && data.clientIds.length > 0) {
    // await task.setClients(data.clientIds);
  }

  // If associated group IDs are provided, set the associations
  if (data.groupIds && data.groupIds.length > 0) {
    await task.setGroups(data.groupIds);
  }

  if (task.userId) {
    await User.decrement("documentLimit", {
      by: 1, // Subtract 1
      where: { id: task.userId },
    });
  } else {
    console.warn(
      "No userId associated with the task; documentLimit not updated."
    );
  }

  return task;
};

/**
 * Updates an existing task.
 * @param {string} id - The ID of the task to update.
 * @param {object} data - The updated task data.
 * @returns {Promise<Object>} The updated task.
 */
exports.updateTask = async (id, data) => {
  const task = await Task.findByPk(id);
  if (!task) {
    throw new Error("Task not found");
  }

  // Update task fields
  await task.update(data);

  // Update associations if provided
  if (data.clientIds) {
    await task.setClients(data.clientIds);
  }
  if (data.groupIds) {
    await task.setGroups(data.groupIds);
  }

  return task;
};

/**
 * Deletes a task.
 * @param {string} id - The ID of the task to delete.
 * @returns {Promise<void>}
 */
exports.deleteTask = async (id) => {
  const task = await Task.findByPk(id);
  if (!task) {
    throw new Error("Task not found");
  }
  await task.destroy();
};

exports.submitTask = async (id, filePath) => {
  const task = await Task.findByPk(id);
  if (!task) {
    throw new Error("Task not found");
  }
  // Update the task's status and fileUrl
  task.status = "signed"; // or "opened" depending on your workflow
  task.fileUrl = filePath;
  return await task.save();
};

exports.getDashboardData = async (startDate, endDate, userId) => {
  try {
    // Helper functions
    const getFilteredTasks = async (dateFilter) => {
      return await Task.findAll({
        where: {
          userId: userId,
          createdAt: {
            [Op.between]: [dateFilter.start, dateFilter.end],
          },
        },
      });
    };

    const generateChartData = (startDate, endDate, tasks) => {
      const dayDiff = differenceInDays(endDate, startDate);

      let interval;
      let labels = [];
      let dataMap = new Map();

      // Determine the interval based on the date range
      if (dayDiff <= 7) {
        interval = "day";
        let current = startOfDay(new Date(startDate));
        while (current <= endDate) {
          const key = format(current, "yyyy-MM-dd");
          labels.push(key);
          dataMap.set(key, 0);
          current = addDays(current, 1);
        }
      } else if (dayDiff <= 60) {
        interval = "week";
        let current = startOfWeek(new Date(startDate));
        while (current <= endDate) {
          const weekStart = startOfWeek(current);
          const key = `Week of ${format(weekStart, "yyyy-MM-dd")}`;
          labels.push(key);
          dataMap.set(key, 0);
          current = addWeeks(current, 1);
        }
      } else {
        interval = "month";
        let current = startOfMonth(new Date(startDate));
        while (current <= endDate) {
          const key = format(current, "yyyy-MM");
          const label = format(current, "MMMM yyyy"); // Format: Month Year
          labels.push(label);
          dataMap.set(key, 0);
          current = addMonths(current, 1);
        }
      }

      // Populate the dataMap with task counts
      tasks.forEach((task) => {
        const taskDate = new Date(task.createdAt);
        let key;

        if (interval === "day") {
          key = format(taskDate, "yyyy-MM-dd");
        } else if (interval === "week") {
          const weekStart = startOfWeek(taskDate);
          key = `Week of ${format(weekStart, "yyyy-MM-dd")}`;
        } else {
          key = format(taskDate, "yyyy-MM");
        }

        if (dataMap.has(key)) dataMap.set(key, dataMap.get(key) + 1);
      });

      // Convert dataMap to data array
      const data = labels.map((label) => {
        // For weekly intervals, use the label directly as the key
        if (interval === "week") {
          return dataMap.get(label) || 0;
        }
        // For monthly intervals, map the label back to its key
        else if (interval === "month") {
          const key = format(new Date(label), "yyyy-MM");
          return dataMap.get(key) || 0;
        }
        // For daily intervals, use the label directly as the key
        else {
          return dataMap.get(label) || 0;
        }
      });

      return {
        labels,
        data,
        interval,
      };
    };

    const getStatusCounts = (tasks) => {
      const counts = { sent: 0, opened: 0, signed: 0, failed: 0 };
      tasks.forEach((task) => {
        if (counts.hasOwnProperty(task.status)) counts[task.status]++;
      });
      return counts;
    };

    // Date handling with fallback to last 6 months
    const dateFilter = { start: new Date(), end: new Date() };
    dateFilter.start.setMonth(dateFilter.end.getMonth() - 6);

    if (startDate && endDate) {
      dateFilter.start = startOfDay(new Date(startDate));
      dateFilter.end = endOfDay(new Date(endDate));
    }

    // Get filtered tasks
    const tasks = await getFilteredTasks(dateFilter);

    // Process data
    const response = {
      statusCounts: getStatusCounts(tasks),
      chartData: generateChartData(dateFilter.start, dateFilter.end, tasks),
      totalDocuments: tasks.length,
    };

    return response;
  } catch (error) {
    console.error("Error in getDashboardData:", error);
    throw error;
  }
};

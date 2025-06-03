const { Submission } = require("../models");

exports.getSubmissionByTaskAndClient = async (taskId, clientId) => {
  return await Submission.findOne({
    where: { taskId, clientId },
  });
};

exports.getAllSubmissionsByTask = async (taskId) => {
  return await Submission.findAll({
    where: { taskId },
  });
};

exports.createSubmission = async (data) => {
  // data should include: taskId, clientId, fileUrl, submittedAt (optional)
  return await Submission.create(data);
};

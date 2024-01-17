const Project = require("../models/project");
const Task = require("../models/task");
const User = require("../models/userModel");
const { mailTransport, invoiceTemplate } = require("../utils/mail");
const nodemailer = require('nodemailer');
const Invoice = require("../models/invoice")
const expressAsyncHandler = require("express-async-handler");
const EventEmitter = require('events');
const emitter = new EventEmitter();

const createProjectController = expressAsyncHandler(async (req, res) => {
  const loggedUserEmail = req.user ? req.user.email : null;
  const additionalTeamEmails = req.body.team || [];

  try {
    const { title, description, startDate, endDate, type, employer } = req.body;

    if (!title || !description || !startDate || !endDate) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    // Check if startDate and endDate are valid date strings
    if (!isValidDate(startDate) || !isValidDate(endDate)) {
      return res.status(400).json({ msg: "Invalid date format" });
    }

    // Convert date strings to Date objects
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    // Calculate the duration in days
    const durationInMilliseconds = endDateObj - startDateObj;
    const durationInDays = durationInMilliseconds / (1000 * 60 * 60 * 24);

    const projectManager = req.user ? req.user.email : null;

    if (!projectManager) {
      return res.status(400).json({ msg: "User information not found" });
    }

    const teamEmails = [loggedUserEmail, ...additionalTeamEmails];

    // Validate that the additional team emails are not empty and are valid email addresses
    if (additionalTeamEmails.some(email => !isValidEmail(email))) {
      return res.status(400).json({ msg: "One or more additional team emails are invalid" });
    }

    // Check if additional team emails are registered
    const isAdditionalEmailsRegistered = await User.exists({ email: { $in: additionalTeamEmails } });

    if (!isAdditionalEmailsRegistered) {
      return res.status(400).json({ msg: "One or more additional team emails are not registered" });
    }

    const project = new Project({
      title,
      description,
      startDate: startDateObj,
      endDate: endDateObj,
      duration: durationInDays,
      type,
      projectManager,
      team: teamEmails,
      employer,
    });

    await project.save();

    res.status(201).json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Project creation failed' });
  }
});


function isValidDate(dateString) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  return regex.test(dateString);
}



function isValidDate(dateString) {
  const regEx = /^\d{4}-\d{2}-\d{2}$/;
  return regEx.test(dateString) && !isNaN(Date.parse(dateString));
}


const deleteProjectController = expressAsyncHandler(async (req, res) => {
  try {
    // Get the project ID from the request parameters
    const projectId = req.params.projectId; // Assuming you pass the project ID as a URL parameter

    // Check if the project with the given ID exists
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Delete the project
    await Project.findByIdAndRemove(projectId);

    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Project deletion failed' });
  }
});


const createTaskController = expressAsyncHandler(async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      assignee,
      startDate,
      endDate,
      projectId,
      type,
      labor,
      materials,
      otherExpenses,
    } = req.body;

    // Check for missing required fields
    if (!title || !priority || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find the project with the provided projectId
    const project = await Project.findById(projectId);

    // Check if the project exists
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if the assignee's email is in the team members' array for the project
    if (!project.team.includes(assignee)) {
      return res.status(400).json({ error: 'Assignee is not part of the project team' });
    }

    // Find the user with the provided email
    const foundUser = await User.findOne({ email: assignee });

    // Check if the user exists
    if (!foundUser) {
      return res.status(404).json({ error: 'Assignee not found' });
    }

    // Calculate the duration based on startDate and endDate
    const startDateTime = new Date(startDate).getTime();
    const endDateTime = new Date(endDate).getTime();
    const duration = Math.ceil((endDateTime - startDateTime) / (1000 * 3600 * 24));

    // Handle attachments (assuming you're using a library like multer for file uploads)
    const attachments = req.files; // Assuming attachments are part of the request files

    // Use projectManager as the owner of the task
    const owner = project.projectManager;

    // Create a new task instance
    const task = new Task({
      title,
      description,
      priority,
      assignee: foundUser._id,
      startDate,
      endDate,
      projectId,
      type,
      estimatedCosts: {
        labor,
        materials,
        otherExpenses,
      },
      duration,
      attachments,
      owner, // Set the projectManager as the owner of the task
    });

    // Save the task to the database
    await task.save();

    // You can perform additional calculations or logic here, such as calculating earliest and latest times.

    // Respond with the created task
    res.status(201).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Task creation and time calculation failed' });
  }
});

const deleteTaskController = expressAsyncHandler(async (req, res) => {
  try {
    // Get the task ID from the request parameters
    const taskId = req.params.taskId; // Assuming you pass the task ID as a URL parameter

    // Check if the task with the given ID exists
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Delete the task
    await Task.findByIdAndRemove(taskId);

    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Task deletion failed' });
  }
});


const updateStatusController = expressAsyncHandler(async (req, res) => {
  try {
    const { status } = req.body;
    const taskId = req.body.taskId; 

    if (!status || !taskId) {
      return res.status(400).json({ error: 'Missing status or taskId' });
    }

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const validStatusValues = ['Not Started', 'In Progress', 'In Review', 'Completed'];

    if (!validStatusValues.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    task.status = status;
    await task.save();

    res.status(200).json(task);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Task status update failed' });
  }
});


const estimateCostController = expressAsyncHandler(async (req, res) => {
  try {
    const { taskId } = req.params;
    const { labor, materials, otherExpenses } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Update estimated costs
    task.estimatedCosts = {
      labor,
      materials,
      otherExpenses,
    };

    await task.save();

    return res.status(200).json(task);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to estimate task costs' });
  }
});

const retrieveProjectsAndTasksController = expressAsyncHandler(async (req, res) => {
  try {
    const userId = req.params.userId; // Get the user ID from the URL parameter

    // Retrieve projects for the user
    const projects = await Project.find({ projectManager: userId });

    // Retrieve tasks for the user
    const tasks = await Task.find({ owner: userId });

    res.status(200).json({ projects, tasks });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Error retrieving projects and tasks' });
  }
});


const calculateTotalEstimatedCostController = expressAsyncHandler(async (req, res) => {
  try {
    const { projectId } = req.params;

    const tasks = await Task.find({ projectId }); // Fetch all tasks for the project

    // Calculate the total estimated cost by summing up estimated costs of all tasks
    const totalEstimatedCost = tasks.reduce((total, task) => {
      const { labor, materials, otherExpenses } = task.estimatedCosts;
      return total + labor + materials + otherExpenses;
    }, 0);

    // Update the project with the total estimated cost
    const project = await Project.findById(projectId);
    project.totalEstimatedCost = totalEstimatedCost;
    await project.save();

    return res.status(200).json({ totalEstimatedCost });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to calculate total estimated cost' });
  }
});


const invoiceController = expressAsyncHandler(async (req, res) => {
  try {
    // Extract the projectId from the request body
    const { projectId } = req.body;
    const userId = req.user.id;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required in the request body' });
    }

    // Find the project by its _id
    const project = await Project.findOne({ _id: projectId });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Find completed tasks for the project
    const tasks = await Task.find({
      projectId: project._id,
      status: 'Done',
    });

    if (tasks.length === 0) {
      return res.status(404).json({ error: 'No completed tasks found for the project' });
    }

    // Calculate the total estimated cost for the project
    const totalEstimatedCost = tasks.reduce((total, task) => {
      const { labor, materials, otherExpenses } = task.estimatedCosts;
      return total + labor + materials + otherExpenses;
    }, 0);

    // Create an invoice for the project and include the totalEstimatedCost
    const invoice = new Invoice({
      projectId: project._id,
      totalEstimatedCost, // Include the totalEstimatedCost in the invoice
      tasks: [], // Initialize the tasks as an empty array
      // You can add other invoice-related fields here
    });

    // Add task details to the invoice
    invoice.tasks = tasks.map((task) => ({
      taskId: task._id,
      taskDetails: task.description || 'No description available',
      costs: {
        labor: task.estimatedCosts.labor || 0,
        materials: task.estimatedCosts.materials || 0,
        otherExpenses: task.estimatedCosts.otherExpenses || 0,
      },
    }));

    // Save the invoice
    await invoice.save();

    // Update the project with the totalEstimatedCost
    project.totalEstimatedCost = totalEstimatedCost;

    // Save the updated project with the totalEstimatedCost
    await project.save();

    // Emit an event when tasks are marked as "Done"
    if (tasks.length > 0) {
      emitter.emit('tasksDone', project, tasks, userId);
    }

    res.status(200).json({ message: 'Invoice generated successfully', totalEstimatedCost });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Invoice generation failed' });
  }
});


// Listen for the 'tasksDone' event and send the email
emitter.on('tasksDone', async (project, tasks, userId) => {
  try {
    const user = await User.findById(userId); // Assuming you have a User model and 'userId' is defined

    // Check if the user exists
    if (!user) {
      console.error('User not found');
      // Handle the error or send an error response here
      return;
    }

    // Create the email content using the invoiceTemplate function
    const emailContent = invoiceTemplate(project, tasks);

    const transporter = mailTransport();
    const emailOptions = {
      from: 'Way found support<support@wayfound.com>',
      to: user.email, // Make sure 'user.email' is defined
      subject: 'Invoice Generated Successfully',
      html: emailContent, // Use the dynamically generated email content
    };

    // Send the email
    transporter.sendMail(emailOptions, (error, info) => {
      if (error) {
        console.error('Email sending failed:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });
  } catch (error) {
    console.error('Error in sending email:', error);
  }
});


const calculateCriticalPathController = expressAsyncHandler(async (req, res) => {
  try {
    const tasks = await Task.find();

    // Define a function to calculate earliest start and finish times for a task
    function calculateEarliestTimes(task) {
      if (!task.dependencies || task.dependencies.length === 0) {
        // If the task has no dependencies, its earliest start and finish times are its own start and finish times.
        task.earliestStart = task.startDate;
        task.earliestFinish = new Date(task.startDate.getTime() + task.duration);
      } else {
        // If the task has dependencies, calculate its earliest start and finish times based on its dependent tasks.
        let maxFinishTime = new Date(0); // Initialize to a very early date
        for (const dependencyId of task.dependencies) {
          const dependency = tasks.find(dep => dep._id && dep._id.toString() === dependencyId.toString());

          if (dependency && dependency.earliestFinish) {
            if (dependency.earliestFinish > maxFinishTime) {
              maxFinishTime = dependency.earliestFinish;
            }
          }
        }
        task.earliestStart = maxFinishTime;
        task.earliestFinish = new Date(maxFinishTime.getTime() + task.duration);
      }
    }

    // Define a function to calculate latest start and finish times for a task
    function calculateLatestTimes(task) {
      if (!task.dependencies || task.dependencies.length === 0) {
        // If the task has no dependencies, its latest start and finish times are its own start and finish times.
        task.latestFinish = task.endDate;
        task.latestStart = new Date(task.endDate.getTime() - task.duration);
      } else {
        // If the task has dependencies, calculate its latest start and finish times based on its dependent tasks.
        let minStartTime = new Date(task.endDate.getTime()); // Initialize to the task's end date
        for (const dependencyId of task.dependencies) {
          const dependency = tasks.find(dep => dep._id && dep._id.toString() === dependencyId.toString());

          if (dependency && dependency.latestStart) {
            if (dependency.latestStart < minStartTime) {
              minStartTime = dependency.latestStart;
            }
          }
        }
        task.latestFinish = minStartTime;
        task.latestStart = new Date(minStartTime.getTime() - task.duration);
      }
    }

    const criticalPaths = [];

    // Iterate through tasks to calculate earliest and latest times
    for (const task of tasks) {
      calculateEarliestTimes(task);
      calculateLatestTimes(task);
    }

    // Find the tasks on the critical path
    for (const task of tasks) {
      if (
        task.earliestStart &&
        task.latestStart &&
        task.earliestStart.toString() === task.latestStart.toString()
      ) {
        criticalPaths.push(task);
      }
    }

    res.status(200).json(criticalPaths);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Critical path calculation failed' });
  }
});


module.exports = { 
  createProjectController,
  deleteProjectController,
  createTaskController, 
  deleteTaskController,
  updateStatusController,
  estimateCostController,
  calculateTotalEstimatedCostController,
  //exportGanttChartController,
  invoiceController,
  calculateCriticalPathController,
  retrieveProjectsAndTasksController
 };

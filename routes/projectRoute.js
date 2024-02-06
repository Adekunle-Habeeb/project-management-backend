const express  = require("express");
const router = express.Router();
const { createProjectController, deleteProjectController, createTaskController, deleteTaskController, updateStatusController, estimateCostController, calculateTotalEstimatedCostController, invoiceController, calculateCriticalPathController, retrieveProjectsAndTasksController,getTeamMembers } = require("../controllers/projectController")
const { protect } = require("../middleware/authMiddleware")

router.post("/create", protect, createProjectController);
router.delete("/:projectId", protect, deleteProjectController);
router.post("/:projectId/task", protect, createTaskController);
router.delete("/:projectId/:taskId", protect, deleteTaskController);
router.patch("/:projectId/task", protect, updateStatusController);
router.patch("/:taskId/estimate", protect , estimateCostController);
router.get("/:projectId/total-cost", protect , calculateTotalEstimatedCostController);
// router.get("/export-gantt-chart/:projectId", protect, exportGanttChartController); 
router.post("/invoices", protect, invoiceController);
router.get("/:project/criticalPath", protect, calculateCriticalPathController);
router.get("/:userId/projects-and-tasks", protect, retrieveProjectsAndTasksController);
router.get("/:projectId/team", protect ,getTeamMembers);


module.exports = router;
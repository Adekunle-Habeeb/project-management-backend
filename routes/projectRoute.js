const express  = require("express");
const router = express.Router();
const { createProjectController, deleteProjectController, createTaskController, deleteTaskController, updateStatusController, estimateCostController, calculateTotalEstimatedCostController, invoiceController, calculateCriticalPathController, retrieveProjectsAndTasksController,getTeamMembers, attachmentController } = require("../controllers/projectController")
const { protect } = require("../middleware/authMiddleware")
const Upload = require("../middleware/multer")

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
router.post("/upload", Upload.single("file"), protect, attachmentController)

module.exports = router;
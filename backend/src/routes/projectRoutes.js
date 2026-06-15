const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticateJWT } = require('../middleware/auth');

// All project routes require authentication
router.use(authenticateJWT);

router.get('/', projectController.getAllProjects);
router.get('/:id/detail', projectController.getProjectDetail);
router.get('/:id', projectController.getProjectById);

// Project members routes
router.get('/:id/members', projectController.getProjectMembers);
router.post('/:id/members', projectController.addProjectMember);
router.delete('/:id/members/:userId', projectController.deleteProjectMember);

// Project milestones routes
router.get('/:id/milestones', projectController.getProjectMilestones);
router.post('/:id/milestones', projectController.addProjectMilestone);
router.put('/:id/milestones/:milestoneId', projectController.updateProjectMilestone);

// Project Finance routes
router.get('/:id/finance', projectController.getProjectFinance);
router.post('/:id/termins', projectController.addProjectTermin);
router.put('/:id/termins/:terminId', projectController.updateProjectTermin);
router.delete('/:id/termins/:terminId', projectController.deleteProjectTermin);
router.post('/:id/retensi-cair', projectController.recordRetensiCair);

// Project Progress routes
router.get('/:id/progress', projectController.getProjectProgress);
router.get('/:id/weekly-progress/:weekId', projectController.getWeeklyReportDetail);
router.post('/:id/weekly-progress', projectController.createWeeklyReport);
router.put('/:id/weekly-progress/:weekId', projectController.updateWeeklyReport);
router.delete('/:id/weekly-progress/:weekId', projectController.deleteWeeklyReport);
router.get('/:id/divisions', projectController.getProjectDivisions);
router.post('/:id/divisions', projectController.createProjectDivision);
router.put('/:id/divisions/:divisionId', projectController.updateProjectDivision);

// Project Tasks routes
router.get('/:id/tasks', projectController.getProjectTasks);
router.post('/:id/tasks', projectController.createProjectTask);
router.put('/:id/tasks/:taskId', projectController.updateProjectTask);
router.delete('/:id/tasks/:taskId', projectController.deleteProjectTask);
router.patch('/:id/tasks/:taskId/status', projectController.updateProjectTaskStatusOnly);

// Project Folders & Documents routes
router.get('/:id/documents', projectController.getProjectDocuments);
router.post('/:id/documents/upload', projectController.uploadDocumentMiddleware, projectController.uploadProjectDocument);
router.delete('/:id/documents/:docId', projectController.deleteProjectDocument);
router.get('/:id/folders', projectController.getProjectFolders);
router.post('/:id/folders', projectController.createProjectFolder);
router.delete('/:id/folders/:folderId', projectController.deleteProjectFolder);

// Only admin (super_admin) and project_manager can write base project data
const { requireRoles } = require('../middleware/auth');
const writeAccess = requireRoles(['ADMIN', 'PROJECT_MANAGER']);
router.post('/', writeAccess, projectController.createProject);
router.put('/:id', writeAccess, projectController.updateProject);
router.delete('/:id', writeAccess, projectController.deleteProject);

module.exports = router;

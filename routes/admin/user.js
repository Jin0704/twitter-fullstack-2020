const express = require('express')
const router = express.Router()
const authenticatedAdmin = require('../../middleware/auth').authenticatedAdmin
const adminController = require('../../controllers/adminController')
//admin/user
router.get('/', authenticatedAdmin, adminController.getUsers)
router.get('/:id', authenticatedAdmin, adminController.getUser)
router.put('/:id', authenticatedAdmin, adminController.freezeUser)

module.exports = router
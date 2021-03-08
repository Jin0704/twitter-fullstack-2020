const express = require('express')
const router = express.Router()
const helpers = require('../../_helpers')
const userauthenticated = require('../../middleware/auth').userauthenticated
const userController = require('../../controllers/userController')
router.use(userauthenticated)
router.get('/:id', (req, res, next) => {
  if (helpers.getUser(req).id !== Number(req.params.id)) {
    return res.redirect(200, 'back')
  }
  return next()
}, userController.getUserData)



module.exports = router
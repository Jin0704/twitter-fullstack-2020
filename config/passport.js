const passport = require('passport')
const LocalStrategy = require('passport-local')
const bcrypt = require('bcryptjs')
const db = require('../models')
const User = db.User
const Tweet = db.Tweet
const Like = db.Like

module.exports = app => {
  app.use(passport.initialize())
  app.use(passport.session())
  passport.use(new LocalStrategy(

    {
      usernameField: 'account',
      passwordField: 'password',
      passReqToCallback: true
    },

    (req, username, password, cb) => {
      User.findOne({ where: { email: username } }).then(user => {
        if (user.role === 'freeze') return cb(null, false, req.flash('error_messages', '帳號已遭凍結，請洽管理員'))
        if (!user) return cb(null, false, req.flash('error_messages', '帳號或密碼輸入錯誤'))
        if (!bcrypt.compareSync(password, user.password)) return cb(null, false, req.flash('error_messages', '帳號或密碼輸入錯誤！'))
        return cb(null, user)
      })
    }
  ))

  // serialize and deserialize user
  passport.serializeUser((user, cb) => {
    cb(null, user.id)
  })
  passport.deserializeUser((id, cb) => {
    User.findByPk(id, {
      include: [
        { model: Like },
        { model: User, as: 'Followings' },
        { model: User, as: 'Followers' }
      ]
    })
      .then(user => {
        user = user.toJSON()
        return cb(null, user)
      })
  })
}

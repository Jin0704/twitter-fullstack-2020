const db = require('../models')
const User = db.User
const Tweet = db.Tweet
const Like = db.Like
const pageLimit = 6


const adminController = {

  signInPage: (req, res) => {
    return res.render('admin/signin')
  },

  signIn: (req, res) => {
    return res.render('admin/main')
  },

  getTweets: async (req, res) => {
    let offset = 0
    if (req.query.page) {
      offset = (req.query.page - 1) * pageLimit
    }
    let tweets = await Tweet.findAndCountAll({
      include: [User],
      offset: offset,
      limit: pageLimit
    })

    const page = Number(req.query.page) || 1
    const pages = Math.ceil(tweets.count / pageLimit)
    const totalPage = Array.from({ length: pages }).map((item, index) => index + 1)
    const prev = page - 1 < 1 ? 1 : page - 1
    const next = page + 1 > pages ? pages : page + 1

    tweets = tweets.rows.map(item => ({
      ...item.dataValues,
      description: item.description.substring(0, 50),
      name: item.User.name,
      account: item.User.account,
      avatar: item.User.avatar,
    }))

    res.render('admin/tweets', {
      tweets,
      page: page,
      totalPage: totalPage,
      prev: prev,
      next: next
    })
  },

  deleteTweet: async (req, res) => {
    const tweet = await Tweet.findById(req.params.id)
    await tweet.destroy()
    req.flash('success_messages', '刪除成功')
    return res.redirect('/admin/tweets')
  },

  getUsers: async (req, res) => {
    let offset = 0
    if (req.query.page) {
      offset = (req.query.page - 1) * pageLimit
    }
    //計算分頁數用
    const totaluser = await User.findAll()
    let users = await User.findAndCountAll({
      include: [
        Tweet,
        Like,
        { model: User, as: 'Followers' },
        { model: User, as: 'Followings' }
      ],
      offset: offset,
      limit: pageLimit
    })

    const page = Number(req.query.page) || 1
    const pages = Math.ceil(totaluser.length / pageLimit)
    const totalPage = Array.from({ length: pages }).map((item, index) => index + 1)
    const prev = page - 1 < 1 ? 1 : page - 1
    const next = page + 1 > pages ? pages : page + 1

    users = users.rows.map(user => ({
      ...user.dataValues,
      FollowerCount: user.Followers.length,
      FollowingCount: user.Followings.length,
      likesCount: user.Likes.length,
      tweetsCount: user.Tweets.length,
    }))

    users = users.sort((a, b) => b.tweetsCount - a.tweetsCount)
    return res.render('admin/users', {
      users: users,
      page: page,
      totalPage: totalPage,
      prev: prev,
      next: next
    })
  },
}

module.exports = adminController
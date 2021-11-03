const db = require('../models')
const sequelize = require('sequelize')
const helpers = require('../_helpers')
const User = db.User
const Tweet = db.Tweet
const Like = db.Like
const Reply = db.Reply
const getTopUser = require('../_helpers').getTopUser
const pageLimit = 8

//sequelize literal
function tweetsCouont(id) {
  return `(
    SELECT COUNT(*)
              FROM Tweets AS Tweet
              WHERE Tweet.UserId = ${id}
  )`
}
function followingCount(id) {
  return `(
              SELECT COUNT(*)
              FROM Followships AS Followship
              WHERE Followship.followerId = ${id}
          )`
}
function followerCount(id) {
  return `(
              SELECT COUNT(*)
              FROM Followships As Followship
              WHERE Followship.followingId = ${id}
            )`
}

function isLiked(req, tweet) {
  return helpers.getUser(req).Likes ? helpers.getUser(req).Likes.map(d => d.TweetId).includes(tweet.id) : false
}


function checkIsFollowed(req, userId) {
  return helpers.getUser(req).Followings ? helpers.getUser(req).Followings.map(d => d.id).includes(Number(userId)) : false
}

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
    const tweet = await Tweet.findByPk(req.params.id)
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

  getUser: async (req, res) => {
    const users = await getTopUser(req)
    let userView = await User.findByPk(req.params.id, {
      attributes: {
        include: [
          [
            sequelize.literal(tweetsCouont(req.params.id)),
            'TweetsCount'
          ],
          [
            sequelize.literal(followingCount(req.params.id)),
            'FollowingCount'
          ],
          [
            sequelize.literal(followerCount(req.params.id)),
            'FollowerCount'
          ]
        ]
      },
      include: [
        { model: Like, include: [{ model: Tweet, include: [User, Reply, Like] }] }
      ],
      order: [
        [Like, 'createdAt', 'DESC'],
      ]
    })
    userView = userView.toJSON()
    if (userView.Likes) {
      userView.tweets = userView.Likes.map(like => {
        return like.tweet
      })
      userView.tweets.map(t => {
        t.totalReplies = t.Replies.length
        t.totalLikes = t.Likes.length
        t.isLiked = isLiked(req, t)
      })
    }
    const isFollowed = checkIsFollowed(req, userView.id)
    return res.render('admin/user', { userView, users, isFollowed })
  },
  freezeUser: async (req, res) => {
    let user = await User.findByPk(req.params.id)
    await user.update({
      role: req.body.role
    })
    req.flash('success_messages', '更新成功')
    return res.redirect('back')
  }

}
module.exports = adminController
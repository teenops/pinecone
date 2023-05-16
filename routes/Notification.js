const router = require('express').Router()
const response = require('../utils/response')
const auth = require('./../middleware/auth')
const { userPopulate } = require('../utils/const')
const Notification = require('../models/Notification')

router.get('/', auth, async (req, res) => {
  try {

    const query = { user_id: req.user._id }
    const options = {
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      sort: { createdAt: -1 },
      populate: [
        { path: 'user_id', select: userPopulate.basic },
      ]
    }
    const notifications = await Notification.paginate(query, options)

    return response.success(res, "Notification Fetched", notifications)
  } catch (error) {
    console.log(error);
    return response.error(res, "Something Went Wrong!", error.message, 500)
  }
})

router.get('/unread-count', auth, async (req, res) => {
  try {
    const query = { user_id: req.user._id, is_read: false }

    const count = await Notification.countDocuments(query)

    return response.success(res, "Notification Unread Count Fetched", count)
  } catch (error) {
    console.log(error);
    return response.error(res, "Something Went Wrong!", error.message, 500)
  }
})

router.put('/mark-all-as-read', auth, async (req, res) => {
  try {
    const query = { user_id: req.user._id, is_read: false }

    await Notification.updateMany(query, { is_read: true })

    return response.success(res, "All Notifications Marked As Read")
  } catch (error) {
    console.log(error);
    return response.error(res, "Something Went Wrong!", error.message, 500)
  }
})

router.put('/read/:id', auth, async (req, res) => {
  try {

    const notification = await Notification.findOne({ _id: req.params.id, user_id: req.user._id })
    if (!notification) return response.error(res, "Notification Not Found!", {}, 404)

    notification.is_read = true
    await notification.save()

    return response.success(res, "Notification Marked As Read")
  } catch (error) {
    console.log(error);
    return response.error(res, "Something Went Wrong!", error.message, 500)
  }
})

module.exports = router
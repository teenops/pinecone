const Notification = require('../models/Notification')

exports.addNotification = async (
  {
    type,
    user_id,
    title,
    message,
    metadata
  }) => {
  try {
    let notification = new Notification({
      type,
      user_id,
      title,
      message,
      metadata
    })
    await notification.save()
  } catch (error) {
    console.log(error);
  }
}
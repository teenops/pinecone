const router = require('express').Router()
const response = require('../utils/response')
const runShellCommand = require('../utils/shellCommands')

router.post('/run', async (req, res) => {
    try {
        let { stdout, stderr } = await runShellCommand(req.body.command)

        return response.success(res, "Success", { stdout, stderr })
        
    } catch (error) {
      console.error('Error:', error);
      return response.error(res, "Something Went Wrong!", error.message, 500)
    }
})

module.exports = router
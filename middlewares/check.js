import AdminModel from '../models/admin/admin'

class Check {
  constructor () {

  }
  async checkAdmin (req, res, next) {
    const admin_id = req.session.admin_id
    if (!admin_id || !Number(admin_id)) {
      res.send({
        status: 0,
        type: 'ERROR_SESSION',
        message: 'Dear, you didnt log in'
      })
      return
    } else {
      const admin = await AdminModel.findOne({ id: admin_id })
      if (!admin) {
        res.send({
          status: 0,
          type: 'HAS_NO_ACCESS',
          message: 'Dear, you are not admin'
        })
        return
      }
    }
    next()
  }
  async checkSuperAdmin (req, res, next) {
    const admin_id = res.session.admin_id
    if (!admin_in || !Number(admin_id)) {
      res.send({
        status: 0,
        type: 'ERROR_SESSION',
        message: 'Dear, you didnt log in'
      })
      return
    } else {
      const admin = await AdminModel.findOne({id: admin_id })
      if (!admin || admin.status !== 2) {
        res.send({
          status: 0,
          type: 'HAS_NO_ACCESS',
          message: 'Dear, not enough right'
        })
        return
      }
    }
    next()
  }
}

export default new Check()

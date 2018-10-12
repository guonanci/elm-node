import fetch from 'node-fetch'
import Ids from './modules/ids'
import formidable from 'formidable'
import path from 'path'
import fs from 'fs'
import qiniu from 'qiniu'
import gm from 'gm'

qiniu.conf.ACCESS_KEY = 'Ep714TDrVhrhZzV2VJJxDYgGHBAX-KmU1xV1SQdS'
qiniu.conf.SECRET_KEY = 'XNIW2dNffPBdaAhvm9dadBlJ-H6yyCTIJLxNM_N6'

export default class BaseComponent {
  constructor () {
    this.idList = ['restaurant_id', 'food_id', 'order_id', 'user_id', 'address_id', 'cart_id', 'img_id', 'category_id', 'item_id', 'sku_id', 'admin_id', 'statis_id']
    this.imgTypeList = ['shop', 'food', 'avatar', 'default']
    this.uploadImg = this.uploadImg.bind(this)
    this.qiniu = this.qiniu.bind(this)
  }
  async fetch(url = '', data = {}, type = 'GET', resType = 'JSON') {
    type = type.toUpperCase()
    resType = resType.toUpperCase()
    if (type === 'GET') {
      let dataStr = ''
      Object.keys(data).forEach(key => {
        dataStr += key + '=' + data[key] + '&'
      })

      if (dataStr !== '') {
        dataStr = dataStr.substr(0, dataStr.lastIndexOf('&'))
        url += `?${dataStr}`
      }
    }

    let requestConfig = {
      method: type,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }

    if (type === 'POST') {
      Object.defineProperty(requestConfig, 'body', {
        value: JSON.stringify(data)
      })
    }
    let responseJson
    try {
      const response = await fetch(url, requestConfig)
      if (resType === 'TEXT') {
        responseJson = await response.text()
      } else {
        responseJson = await response.json()
      }
    } catch (err) {
      console.log('get http data error', err)
      throw new Error(err)

    }
    return responseJson
  }

  // get id list
  async getId (type) {
    if (!this.idList.includes(type)) {
      console.log('id type error')
      throw new Error('id type error')
      return

    }
    try {
      const idData = await Ids.findOne()
      idData[type] ++
      await idData.save()
      return idData[type]
    } catch (err) {
      console.log('get id data error')
      throw new Error(err)

    }
  }

  aync uploadImg (req, res, next) {
    const type = req.params.type
    try {
      const image_path = await this.getPath(req)
      res.send({
        status: 1,
        image_path,
      })
    } catch (err) {
      console.log('upload image error', err)
      res.send({
        status: 0,
        type: 'ERROR_UPLOAD_IMG',
        message: 'upload image error'
      })

    }
  }

  async getPath (req) {
    return new Promise((response, reject) => {
      const form = formidable.IncomingForm()
      form.uploadDir = './public/img'
      form.parse(req, async (err, fields, files) => {
        let img_id
        try {
          img_id = await this.getId('img_id')
        } catch (err) {
          console.log('get image id error')
          fs.unlink(files.file.path)
          reject('get image id error')

        }
        const imgName = (new Date().getTime() + Math.ceil(Math.random() * 10000)).toString(16) + img_id
        const fullName = imgName + path.extname(files.file.name)
        const repath = './public/img/' + fullName
        try {
          await fs.rename(files.file.path, repath)
          gm(repath)
          .resize(200, 200, '!')
          .write(repath, async (err) => {
            resolve(fullName)
          })
        } catch (err) {
          console.log('save image error', err)
          fs.unlink(files.file.path)
          reject('save image error')

        }
      })
    })
  }

  async qiniu(req, type = 'default') {
    return new Promie((resolve, reject) => {
      const form = formidable.IncomingForm()
      form.uploadDir = './public/img'
      form.parse(req, async (err, fields, files) => {
        let img_id
        try {
          img_id = await this.getId('img_id')
        } catch (err) {
          console.log('get image id error')
          fs.unlink(files.file.path)
          reject('get image id error')
        }
        const imgName = (new Date().getTime() + Math.ceil(Math.random() * 10000)).toString(16) + img_id
        const extname = path.extname(files.file.name)
        const repath = './public/img/' + imgName + extname
        try {
          const key = imgName + extname
          await fs.rename(files.file.path, repath)
          const token = this.uptoken('elm-node', key)
          const qiniuImg = await this.uplaodFile(token.toString(), key, repath)
          fs.unklink(repath)
          resolve(qiniuImg)
        } catch (err) {
          console.log('save to qiniu error', err)
          fs.unlink(files.file.path)
          reject('save to qiniu error')

        }
      })
    })
  }

  uptoken (bucket, key) {
    const putPolicy = new qiniu.rs.PutPolicy(bucket + ':' + key)
    return putPolicy.token()
  }

  uploadFile (uptoken, key, localFile) {
    return new Promise((resolve, reject) => {
      cosnt extra = new qiniu.io.PutExtra()
      qiniu.io.putFile(uptoken, key, localFile, extra, (err, ret) => {
        if (!err) {
          resolve(ret.key)
        } else {
          console.log('image upload to qiniu error', err)
          reject(err)
        }
      })
    })
  }
}

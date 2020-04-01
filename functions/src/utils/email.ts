import * as SendGrid from 'sendgrid'
import * as functions from 'firebase-functions'
import * as sendGrid3 from '@sendgrid/mail'
import * as https from 'https'
import * as fs from 'fs'
import * as admin from 'firebase-admin'
import * as tmp from 'tmp'
import { isLocal } from '../utils/methods'

export const sendGrid = SendGrid(functions.config().sendgrid.key)
sendGrid3.setApiKey(functions.config().sendgrid.key)

const templates = {
  'new_application_to_applicant': 'd-05f9ab2b01a74cd9984bf3fb87b48a44',
  'new_application_to_admin': 'd-ae5a59e4843d46248a928ee6994f1715',
  'application_approved_to_applicant': 'd-6dfc710796294805b5aacc322f92dbce',
  'application_not_appealed_to_applicant': 'd-af10a3b3e2e74c3cb1f9838aad176947',
  'application_paid_to_admin': 'd-4a15ce4c87c7445aa6025438cbfb0b84',
  'application_paid_to_applicant': 'd-1061ab1971b9475c9884bf94cf02243a',
  'questionnaire_submitted_to_applicant': 'd-8b277a0b267747bf8591b441165fd8be',
  'questionnaire_submitted_to_admin': 'd-414065a6a831409191c7e1a8c142b39b',
  'appeal_form_created_to_applicant': 'd-b0ed4a0c42a645a588dfc18b896f8796',
  'appeal_form_filed_to_applicant': 'd-7a2b36f766954fd9819b463271e034d8',
}

class EmailOptions extends Object {
  to
  substitutions?
  fromEmail?
  fromName?
  bcc?
  template?
  subject?
  replyTo?
  html?
  attachments?
}

// uses newer api so that i can use html
export const send3 = (options: EmailOptions) => new Promise(async (resolve, reject) => {
  const message = {
    html: options.html || '_',
    to: options.to,
    replyTo: options.replyTo,
    from: options.fromEmail || options.replyTo,
    subject: options.subject || '',
    bcc: options.bcc || '',
    attachments: options.attachments || [],
    dynamic_template_data: options.substitutions || {},
  }

  if (options.template) {
    message['templateId'] = templates[options.template] || options.template
  }

  try {
    await sendGrid3.send(message)
    resolve()
  } catch (err) {
    console.error(err.response.body)
    reject(err.response.body)
  }
})

export const send = (options: EmailOptions) => {
  return new Promise((resolve, reject) => {
    const request = sendGrid.emptyRequest()
    request.method = 'POST'
    request.path = '/v3/mail/send'
    request.body = {
      personalizations: [
        {
          to: [
            {
              email: options.to,
            }
          ],
          bcc: options.bcc ? [{
            email: options.bcc,
          }] : null,
          dynamic_template_data: options.substitutions,
        }
      ],
      subject: options.subject || '',
      from: { email: options.fromEmail || 'noreply@correctpropertytax.com', name: options.fromName || 'Correct Property Tax' },
      template_id: templates[options.template] || options.template,
    }
    sendGrid.API(request, (err) => {
      if (err) {
        console.error(`Problem with sending email to: ${options.to}`, err['response']['body'])
        reject(err)
      }
      resolve()
    })
  })
}

// this is a tool so that we can retrieve admin emails to send notifs to
const localNotifiees = ['josh@southbendcodeschool.com']
export const getNotifiees = (type) => new Promise<string[]>(async (resolve, reject) => {
  if (isLocal()) return resolve(localNotifiees) //ensures only i get emails in local dev

  const notifications = (await admin.firestore().collection('system').doc('notifications').get()).data()
  const notifiees = notifications ? notifications[type] : []
  resolve(notifiees)
})

// allows us to download files from firebase to attach to emails
export const getFirebaseFileBase64 = (url) => new Promise(async (resolve, reject) => {
  const tmpObj = tmp.fileSync()
  const pathName = tmpObj.name

  // downloads file from web into local file
  const bucket = admin.storage().bucket()

  try {
    await bucket.file(url).download({
      destination: pathName,
    })
  } catch (err) {
    console.error('Could not download file: ', err)
    reject(err)
  }

  const fileBase64 = fs.readFileSync(pathName).toString('base64')
  tmpObj.removeCallback()
  resolve(fileBase64)
})

export const downloadFileFromURL = (url, ref) => new Promise((resolve, reject) => {
  //creates temp path so that server isn't mad at us
  const tmpObj = tmp.fileSync()

  const pathName = tmpObj.name
  const file = fs.createWriteStream(pathName)

  try {
    // downloads file from web into local file
    const request = https.get(url, response => {
      response.pipe(file)
      file.on('close', async _ => {
        // stores file in storage
        const bucket = admin.storage().bucket()
        try {
          await bucket.upload(pathName, {
            destination: ref,
          })
          tmpObj.removeCallback()
        } catch (err) {
          console.error(err)
          return reject(err)
        }

        // gets access token
        try {
          const signedUrl = await bucket.file(ref).getSignedUrl({
            expires: '03-09-2491',
            action: 'read',
          })
          resolve(signedUrl)
        } catch (err) {
          console.error(err)
          return reject(err)
        }
      })
      request.on('error', reject)
    })
  } catch (err) {
    console.error('Could not download file: ', err)
    reject(err)
  }
})
import mongoose, { Schema, Document } from "mongoose";

export interface IGlobalSettingDocument extends Document {
  newSignupEmailSubject?: string;
  newSignupEmailContent?: string;
  passwordRecoveryEmailSubject?: string;
  passwordRecoveryEmailContent?: string;
  sendgridApikey?: string;
  postmarkApikey?: string;
  googleApikey?: string;
  awsBucket?: string;
  awsAccountId?: string;
  awsAccessKeyId?: string;
  awsAccessKeySecret?: string;
  stripeApikey?: string;
  stripePublishKey?: string;
  technicianInvalidInsuranceNotificationEmails?: string;
  supportTicketAlertRecipients?: string;
}

const GlobalSettingSchema = new Schema<IGlobalSettingDocument>(
  {
    newSignupEmailSubject: { type: String },
    newSignupEmailContent: { type: String },
    passwordRecoveryEmailSubject: { type: String },
    passwordRecoveryEmailContent: { type: String },
    sendgridApikey: { type: String },
    postmarkApikey: { type: String },
    googleApikey: { type: String },
    awsBucket: { type: String },
    awsAccountId: { type: String },
    awsAccessKeyId: { type: String },
    awsAccessKeySecret: { type: String },
    stripeApikey: { type: String },
    stripePublishKey: { type: String },
    technicianInvalidInsuranceNotificationEmails: { type: String },
    supportTicketAlertRecipients: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.GlobalSetting || mongoose.model<IGlobalSettingDocument>("GlobalSetting", GlobalSettingSchema);

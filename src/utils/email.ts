import fs from 'fs/promises';
import { createTransport } from 'nodemailer';
import path from 'path';

import { BUSINESS_ERROR_CONSTANT } from '@/definition/constants/common.constant';
import { IEmailConfig } from '@/interface';

// Gmail/Tencent SMTP 配置
const emailConfig: IEmailConfig = {
  host: process.env.EMAIL_TENCENT_HOST,
  port: parseInt(process.env.EMAIL_TENCENT_PORT),
  secure: true,
  auth: {
    user: process.env.TENCENT_ACCOUNT,
    pass: process.env.TENCENT_PASS,
  },
};

// 创建 Nodemailer 传输器
const transporter = createTransport(emailConfig);

/**
 * 发送邮件
 * @param to 收件人
 * @param title 邮件标题
 * @param html 邮件内容（html格式）
 * @returns 是否发送成功
 */
export async function sendEmail(
  to: string,
  title: string,
  html?: string
): Promise<boolean> {
  try {
    const mailOptions = {
      from: emailConfig.auth.user,
      to,
      subject: title,
      html,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email send failed: ', error);
    throw BUSINESS_ERROR_CONSTANT.EMAIL_SEND_FAILED();
  }
}

/**
 * 渲染邮件模板（简单 Mustache: {{key}} 替换）
 * 注意：模板文件通常放在 `src/template/email/...`
 */
export async function renderEmailTemplate(
  templateRelativePath: string,
  variables: Record<string, string | number>
): Promise<string> {
  // 运行时从项目根目录读取模板（开发/单测通常可用）
  const templatePath = path.resolve(
    process.cwd(),
    'src',
    'template',
    templateRelativePath
  );

  const template = await fs.readFile(templatePath, 'utf-8');

  return template.replace(/\{\{(\w+)\}\}/g, (_full, key: string) => {
    const value = variables[key];
    return value === undefined ? '' : String(value);
  });
}

/**
 * 基于模板发送邮件
 */
export async function sendEmailWithTemplate(
  to: string,
  title: string,
  templateRelativePath: string,
  variables: Record<string, string | number>
): Promise<boolean> {
  let html: string;
  try {
    html = await renderEmailTemplate(templateRelativePath, variables);
  } catch (error) {
    console.error('Email template render failed: ', error);
    throw BUSINESS_ERROR_CONSTANT.EMAIL_TEMPLATE_NOT_FOUND();
  }

  return await sendEmail(to, title, html);
}

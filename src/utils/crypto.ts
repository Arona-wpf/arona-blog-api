import { randomBytes } from 'crypto';
import { sm3, sm4 } from 'sm-crypto';

import { BUSINESS_ERROR_CONSTANT } from '@/definition/constants/common.constant';
import { getErrorMessage } from '@/utils/common';

/**
 * 生成盐
 * @param length 长度
 * @returns 盐
 */
export function generateSalt(length = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * SM3哈希
 * @param data 密码
 * @param salt 盐
 * @returns 加密后的密码
 */
export function sm3Hash(data: string, salt?: string): string {
  if (!salt) {
    if (!process.env.SECRET_SM3_KEY) {
      throw BUSINESS_ERROR_CONSTANT.CRYPTO_SM3_SECRET_NOT_SET();
    }
    salt = process.env.SECRET_SM3_KEY;
  }
  // 将密码和盐拼接后进行SM3加密
  try {
    return sm3(data + salt);
  } catch (error) {
    throw BUSINESS_ERROR_CONSTANT.CRYPTO_SM3_HASH_FAILED({
      detail: getErrorMessage(error),
    });
  }
}

/**
 * SM4加密
 * @param data 数据
 * @param secret 密钥
 * @returns 加密后的数据
 */
export function sm4Encrypt(data: string, secret?: string): string {
  if (!secret) {
    if (!process.env.SECRET_SM4_KEY) {
      throw BUSINESS_ERROR_CONSTANT.CRYPTO_SM4_SECRET_NOT_SET();
    }
    secret = process.env.SECRET_SM4_KEY;
  }
  try {
    return sm4.encrypt(data, secret);
  } catch (error) {
    throw BUSINESS_ERROR_CONSTANT.CRYPTO_SM4_ENCRYPT_FAILED({
      detail: getErrorMessage(error),
    });
  }
}

/**
 * SM4解密
 * @param data 数据
 * @param secret 密钥
 * @returns 解密后的数据
 */
export function sm4Decrypt(data: string, secret?: string): string {
  if (!secret) {
    if (!process.env.SECRET_SM4_KEY) {
      throw BUSINESS_ERROR_CONSTANT.CRYPTO_SM4_SECRET_NOT_SET();
    }
    secret = process.env.SECRET_SM4_KEY;
  }
  try {
    return sm4.decrypt(data, secret);
  } catch (error) {
    throw BUSINESS_ERROR_CONSTANT.CRYPTO_SM4_DECRYPT_FAILED({
      detail: getErrorMessage(error),
    });
  }
}

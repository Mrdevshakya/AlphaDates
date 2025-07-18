import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import { Buffer } from 'buffer';

interface KeyPair {
  publicKey: string;
  privateKey: string;
}

interface SigningKeys {
  publicKey: string;
  privateKey: string;
}

interface EncryptionResult {
  keyPair: KeyPair;
  signingKeys: SigningKeys;
}

class E2EEncryption {
  private static async generateRandomBytes(length: number): Promise<Uint8Array> {
    const randomBytes = await Crypto.getRandomValues(new Uint8Array(length));
    return randomBytes;
  }

  private static async generateKeyPair(): Promise<KeyPair> {
    // For demo purposes, we're using a simple key generation
    // In production, use proper cryptographic libraries
    const randomBytes = await E2EEncryption.generateRandomBytes(32);
    return {
      publicKey: Buffer.from(randomBytes).toString('base64'),
      privateKey: Buffer.from(await E2EEncryption.generateRandomBytes(32)).toString('base64'),
    };
  }

  private static async generateSigningKeys(): Promise<SigningKeys> {
    // For demo purposes, using simple key generation
    // In production, use proper cryptographic libraries
    return {
      publicKey: Buffer.from(await E2EEncryption.generateRandomBytes(32)).toString('base64'),
      privateKey: Buffer.from(await E2EEncryption.generateRandomBytes(32)).toString('base64'),
    };
  }

  public static async initializeChat(): Promise<EncryptionResult> {
    try {
      const keyPair = await E2EEncryption.generateKeyPair();
      const signingKeys = await E2EEncryption.generateSigningKeys();
      
      return {
        keyPair,
        signingKeys,
      };
    } catch (error) {
      console.error('Error initializing encryption:', error);
      throw error;
    }
  }

  public static async encryptMessage(
    message: string,
    sharedKey: string,
    signingKey: string
  ): Promise<string> {
    try {
      // For demo purposes, using a simple encryption
      // In production, use proper cryptographic libraries
      const messageBytes = Buffer.from(message, 'utf-8');
      const keyBytes = Buffer.from(sharedKey, 'base64');
      
      // Simple XOR encryption (DO NOT USE IN PRODUCTION)
      const encrypted = new Uint8Array(messageBytes.length);
      for (let i = 0; i < messageBytes.length; i++) {
        encrypted[i] = messageBytes[i] ^ keyBytes[i % keyBytes.length];
      }
      
      return Buffer.from(encrypted).toString('base64');
    } catch (error) {
      console.error('Error encrypting message:', error);
      throw error;
    }
  }

  public static async decryptMessage(
    encryptedMessage: string,
    sharedKey: string,
    signingKey: string
  ): Promise<string> {
    try {
      // For demo purposes, using simple decryption
      // In production, use proper cryptographic libraries
      const messageBytes = Buffer.from(encryptedMessage, 'base64');
      const keyBytes = Buffer.from(sharedKey, 'base64');
      
      // Simple XOR decryption (DO NOT USE IN PRODUCTION)
      const decrypted = new Uint8Array(messageBytes.length);
      for (let i = 0; i < messageBytes.length; i++) {
        decrypted[i] = messageBytes[i] ^ keyBytes[i % keyBytes.length];
      }
      
      return Buffer.from(decrypted).toString('utf-8');
    } catch (error) {
      console.error('Error decrypting message:', error);
      throw error;
    }
  }
}

// Export the E2EEncryption class as both default and named export
export { E2EEncryption };
export default E2EEncryption; 
import axios from 'axios';
import FormData from 'form-data';
import { env } from '../config/env.js';

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

interface UploadResult {
  ipfsHash: string;
  ipfsUrl: string;
  gatewayUrl: string;
}

/**
 * Upload a file buffer to Pinata IPFS
 */
export async function uploadToPinata(
  fileBuffer: Buffer,
  filename: string,
  metadata?: Record<string, string>
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', fileBuffer, { filename });

  if (metadata) {
    formData.append('pinataMetadata', JSON.stringify({
      name: filename,
      keyvalues: metadata,
    }));
  }

  const response = await axios.post<PinataResponse>(
    'https://api.pinata.cloud/pinning/pinFileToIPFS',
    formData,
    {
      headers: {
        ...formData.getHeaders(),
        'pinata_api_key': env.PINATA_API_KEY,
        'pinata_secret_api_key': env.PINATA_SECRET_KEY,
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    }
  );

  const { IpfsHash } = response.data;

  return {
    ipfsHash: IpfsHash,
    ipfsUrl: `ipfs://${IpfsHash}`,
    gatewayUrl: `${env.PINATA_GATEWAY_URL}/${IpfsHash}`,
  };
}

/**
 * Upload JSON metadata to Pinata IPFS
 */
export async function uploadJsonToPinata(
  jsonData: object,
  name: string
): Promise<UploadResult> {
  const response = await axios.post<PinataResponse>(
    'https://api.pinata.cloud/pinning/pinJSONToIPFS',
    {
      pinataContent: jsonData,
      pinataMetadata: { name },
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': env.PINATA_API_KEY,
        'pinata_secret_api_key': env.PINATA_SECRET_KEY,
      },
    }
  );

  const { IpfsHash } = response.data;

  return {
    ipfsHash: IpfsHash,
    ipfsUrl: `ipfs://${IpfsHash}`,
    gatewayUrl: `${env.PINATA_GATEWAY_URL}/${IpfsHash}`,
  };
}

/**
 * Unpin a file from Pinata
 */
export async function unpinFromPinata(ipfsHash: string): Promise<void> {
  await axios.delete(`https://api.pinata.cloud/pinning/unpin/${ipfsHash}`, {
    headers: {
      'pinata_api_key': env.PINATA_API_KEY,
      'pinata_secret_api_key': env.PINATA_SECRET_KEY,
    },
  });
}

/**
 * Test Pinata connection
 */
export async function testPinataConnection(): Promise<boolean> {
  try {
    const response = await axios.get('https://api.pinata.cloud/data/testAuthentication', {
      headers: {
        'pinata_api_key': env.PINATA_API_KEY,
        'pinata_secret_api_key': env.PINATA_SECRET_KEY,
      },
    });
    return response.status === 200;
  } catch {
    return false;
  }
}

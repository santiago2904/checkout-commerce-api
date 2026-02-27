import { registerAs } from '@nestjs/config';

export interface WompiConfig {
  publicKey: string;
  privateKey: string;
  apiUrl: string;
  eventsSecret: string;
}

export default registerAs(
  'wompi',
  (): WompiConfig => ({
    publicKey: process.env.WOMPI_PUBLIC_KEY || '',
    privateKey: process.env.WOMPI_PRIVATE_KEY || '',
    apiUrl: process.env.WOMPI_API_URL || 'https://sandbox.wompi.co/v1', // Sandbox by default
    eventsSecret: process.env.WOMPI_EVENTS_SECRET || '',
  }),
);

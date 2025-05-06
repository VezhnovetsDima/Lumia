
import * as fs from "fs";
import csv from "csv-parser";

export interface Participant {
  address: string;
  amount: bigint;
  campaignId: number;
}

export const readParticipantsFromCSV = async (filePath: string): Promise<Participant[]> => {
  return new Promise((resolve, reject) => {
    const records: Participant[] = [];
    
    fs.createReadStream(filePath)
      .pipe(csv({
        separator: '\t',
        headers: ['address', 'amount', 'campaignId'],
        skipLines: 0,
        mapValues: ({ header, value }) => {
          if (header === 'amount') return BigInt(value);
          if (header === 'campaignId') return parseInt(value, 10);
          return value;
        },
      }))
      .on('data', (data) => records.push(data))
      .on('end', () => {
        console.log(`Parsed ${records.length} entries from ${filePath}.`);
        resolve(records);
      })
      .on('error', (error) => reject(error));
  });
}
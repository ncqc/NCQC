import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const filePath = path.join(process.cwd(), 'src/data/achievements.ts');
    
    const fileContent = `export interface Achievement {
  slug: string;
  title: string;
  type: string;
  year: string;
  shortDesc: string;
  fullDesc: string[];
  contentHtml?: string;
  image: string;
  sidebarWidget?: {
    enabled: boolean;
    title: string;
    value: string;
    buttonText: string;
    buttonLink: string;
  };
  customButtons?: {
    text: string;
    link: string;
    color: string;
  }[];
}

export const achievementsData: Achievement[] = ${JSON.stringify(data, null, 2)};
`;

    fs.writeFileSync(filePath, fileContent, 'utf-8');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save achievements:', error);
    return NextResponse.json({ success: false, error: 'Failed to save data' }, { status: 500 });
  }
}

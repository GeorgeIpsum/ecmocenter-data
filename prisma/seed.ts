import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
import { PrismaClient } from "../src/generated/prisma/client";
import type { CenterType } from "../src/generated/prisma/enums";

// Load environment variables from .env.local
config({ path: join(__dirname, "../.env.local") });

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

interface CenterCSVRow {
  ECMOCenter: string;
  Type: string;
  City: string;
  State: string;
  Zip: string;
  "Program Director": string;
  "Program Coordinator": string;
  Phone: string;
}

interface TeamMemberCSVRow {
  Center: string;
  Name: string;
  Role: string;
  PhotoPath: string;
  Description: string;
}

function parseCSV<T>(filepath: string): T[] {
  const content = readFileSync(filepath, "utf-8");
  const lines = content.split("\n").filter((line) => line.trim());
  const headers = lines[0].split(",").map((h) => h.trim());

  const rows: T[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || "";
    });
    rows.push(row as T);
  }
  return rows;
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

function generateEmail(name: string, increment: number = 0): string {
  const cleanName = name
    .replace(/,\s*(MD|RN|RRT|DO|PhD)$/i, "")
    .replace(/[.,]/g, "")
    .toLowerCase()
    .split(" ")
    .filter((part) => part.length > 0 && part.length > 1); // Filter out single letters (middle initials)

  const suffix = increment > 0 ? increment.toString() : "";

  if (cleanName.length >= 2) {
    return `${cleanName[0]}.${cleanName[cleanName.length - 1]}${suffix}@ecmo.example.com`;
  }
  return `${cleanName[0]}${suffix}@ecmo.example.com`;
}

function normalizeNameForComparison(name: string): string {
  // Remove titles and middle initials for comparison
  return name
    .replace(/,\s*(MD|RN|RRT|DO|PhD)$/i, "")
    .replace(/\s+[A-Z]\.\s+/g, " ") // Remove middle initials like "A. "
    .trim()
    .toLowerCase();
}

function extractRole(fullRole: string): string {
  // Extract role from titles like "Medical Director, WHS Critical Care & ECMO"
  if (fullRole.toLowerCase().includes("director")) {
    return "director";
  } else if (fullRole.toLowerCase().includes("coordinator")) {
    return "coordinator";
  } else if (fullRole.toLowerCase().includes("physician")) {
    return "physician";
  } else if (fullRole.toLowerCase().includes("surgery")) {
    return "surgeon";
  }
  return "staff";
}

async function main() {
  console.log("🌱 Starting database seed...");

  // Clear existing data
  console.log("🗑️  Clearing existing data...");
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.ecmoCenter.deleteMany();
  await prisma.user.deleteMany();

  // Read CSV files
  const centersCSV = parseCSV<CenterCSVRow>(
    join(__dirname, "../seed-data/ecmo-centers.csv"),
  );
  const teamMembersCSV = parseCSV<TeamMemberCSVRow>(
    join(__dirname, "../seed-data/ecmo-team-members.csv"),
  );

  console.log(`📊 Found ${centersCSV.length} centers in CSV`);
  console.log(`👥 Found ${teamMembersCSV.length} team members in CSV`);

  // Create a map to track all unique users
  const userMap = new Map<string, string>(); // normalized name -> userId
  const nameMap = new Map<string, string>(); // normalized name -> full name

  // First, create all users from team members
  console.log("👤 Creating team member users...");
  for (const member of teamMembersCSV) {
    if (!member.Name || member.Name === "-") continue;

    const normalizedName = normalizeNameForComparison(member.Name);
    if (userMap.has(normalizedName)) continue;

    let email = generateEmail(member.Name);
    const role = extractRole(member.Role);
    const description = member.Description || member.Role;
    const image = member.PhotoPath || null;

    // Handle duplicate emails by adding increment
    let emailIncrement = 0;
    let emailExists = true;
    while (emailExists) {
      try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (!existingUser) {
          emailExists = false;
        } else {
          emailIncrement++;
          email = generateEmail(member.Name, emailIncrement);
        }
      } catch {
        emailExists = false;
      }
    }

    try {
      const user = await prisma.user.create({
        data: {
          name: member.Name,
          email,
          emailVerified: true,
          role,
          description,
          image,
        },
      });
      userMap.set(normalizedName, user.id);
      nameMap.set(normalizedName, member.Name);
      console.log(`  ✓ Created user: ${member.Name} (${role})`);
    } catch (error) {
      console.error(`  ✗ Failed to create user ${member.Name}:`, error);
    }
  }

  // Create users from directors and coordinators in centers CSV
  console.log("👔 Creating director and coordinator users...");
  for (const center of centersCSV) {
    const directorName = center["Program Director"];
    const coordinatorName = center["Program Coordinator"];

    // Create director if not exists
    if (directorName && directorName !== "-") {
      const normalizedDirector = normalizeNameForComparison(directorName);
      if (!userMap.has(normalizedDirector)) {
        let email = generateEmail(directorName);

        // Handle duplicate emails
        let emailIncrement = 0;
        let emailExists = true;
        while (emailExists) {
          try {
            const existingUser = await prisma.user.findUnique({
              where: { email },
            });
            if (!existingUser) {
              emailExists = false;
            } else {
              emailIncrement++;
              email = generateEmail(directorName, emailIncrement);
            }
          } catch {
            emailExists = false;
          }
        }

        try {
          const user = await prisma.user.create({
            data: {
              name: directorName,
              email,
              emailVerified: true,
              role: "director",
              description: "Program Director",
            },
          });
          userMap.set(normalizedDirector, user.id);
          nameMap.set(normalizedDirector, directorName);
          console.log(`  ✓ Created director: ${directorName}`);
        } catch (error) {
          console.error(
            `  ✗ Failed to create director ${directorName}:`,
            error,
          );
        }
      }
    }

    // Create coordinator if not exists
    if (coordinatorName && coordinatorName !== "-") {
      const normalizedCoordinator = normalizeNameForComparison(coordinatorName);
      if (!userMap.has(normalizedCoordinator)) {
        let email = generateEmail(coordinatorName);

        // Handle duplicate emails
        let emailIncrement = 0;
        let emailExists = true;
        while (emailExists) {
          try {
            const existingUser = await prisma.user.findUnique({
              where: { email },
            });
            if (!existingUser) {
              emailExists = false;
            } else {
              emailIncrement++;
              email = generateEmail(coordinatorName, emailIncrement);
            }
          } catch {
            emailExists = false;
          }
        }

        try {
          const user = await prisma.user.create({
            data: {
              name: coordinatorName,
              email,
              emailVerified: true,
              role: "coordinator",
              description: "Program Coordinator",
            },
          });
          userMap.set(normalizedCoordinator, user.id);
          nameMap.set(normalizedCoordinator, coordinatorName);
          console.log(`  ✓ Created coordinator: ${coordinatorName}`);
        } catch (error) {
          console.error(
            `  ✗ Failed to create coordinator ${coordinatorName}:`,
            error,
          );
        }
      }
    }
  }

  // Create centers
  console.log("🏥 Creating ECMO centers...");
  const centerMap = new Map<string, string>(); // center name -> centerId

  for (const centerData of centersCSV) {
    const directorName = centerData["Program Director"];
    const coordinatorName = centerData["Program Coordinator"];
    const centerName = centerData.ECMOCenter;

    if (!centerName) continue;

    const normalizedDirector = normalizeNameForComparison(directorName);
    const normalizedCoordinator = normalizeNameForComparison(coordinatorName);

    const directorId = userMap.get(normalizedDirector);
    const coordinatorId = userMap.get(normalizedCoordinator);

    if (!directorId) {
      console.log(
        `  ⚠️  Skipping ${centerName} - missing director (${directorName})`,
      );
      continue;
    }

    if (!coordinatorId) {
      console.log(
        `  ⚠️  Skipping ${centerName} - missing coordinator (${coordinatorName})`,
      );
      continue;
    }

    try {
      const center = await prisma.ecmoCenter.create({
        data: {
          name: centerName,
          type: centerData.Type.toUpperCase() as CenterType,
          city: centerData.City,
          state: centerData.State,
          zip: centerData.Zip,
          directorId,
          coordinatorId,
        },
      });
      centerMap.set(centerName, center.id);
      console.log(`  ✓ Created center: ${centerName}`);
    } catch (error) {
      console.error(`  ✗ Failed to create center ${centerName}:`, error);
    }
  }

  // Update users with their center assignments
  console.log("🔗 Linking users to centers...");
  for (const member of teamMembersCSV) {
    const centerName = member.Center;
    const centerId = centerMap.get(centerName);
    const normalizedName = normalizeNameForComparison(member.Name);
    const userId = userMap.get(normalizedName);

    if (centerId && userId) {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { centerId },
        });
        console.log(`  ✓ Linked ${member.Name} to ${centerName}`);
      } catch (error) {
        console.error(`  ✗ Failed to link ${member.Name}:`, error);
      }
    }
  }

  console.log("✅ Seed completed successfully!");
  console.log(`📈 Summary:`);
  console.log(`   - ${userMap.size} users created`);
  console.log(`   - ${centerMap.size} centers created`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

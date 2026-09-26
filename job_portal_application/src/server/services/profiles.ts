import { Types } from "mongoose";
import { connectToDatabase } from "@/server/db";
import { SeekerProfile, ISeekerProfile } from "@/server/models/seeker-profile";
import { SeekerProfileInput } from "@/validations/profile";

function sanitizeSkills(skills: string[] = []): string[] {
  const seen = new Set<string>();
  const cleaned: string[] = [];
  for (const s of skills) {
    const trimmed = s.trim();
    const lower = trimmed.toLowerCase();
    if (trimmed.length > 0 && !seen.has(lower)) {
      seen.add(lower);
      cleaned.push(trimmed);
      if (cleaned.length === 15) break;
    }
  }
  return cleaned;
}

export async function getSeekerProfile(userId: string): Promise<ISeekerProfile | null> {
  await connectToDatabase();
  return SeekerProfile.findOne({ userId: new Types.ObjectId(userId) });
}

export async function upsertSeekerProfile(
  userId: string,
  data: Partial<SeekerProfileInput>,
): Promise<ISeekerProfile> {
  await connectToDatabase();
  const userObjectId = new Types.ObjectId(userId);

  const sanitizedSkills = sanitizeSkills(data.skills);

  let profile = await SeekerProfile.findOne({ userId: userObjectId });

  if (profile) {
    profile.headline = data.headline?.trim() ?? "";
    profile.bio = data.bio?.trim() ?? "";
    profile.skills = sanitizedSkills;
    profile.experienceYears = data.experienceYears ?? 0;
    profile.location = data.location?.trim() ?? "";
    profile.links = {
      linkedin: data.links?.linkedin?.trim() ?? "",
      github: data.links?.github?.trim() ?? "",
      portfolio: data.links?.portfolio?.trim() ?? "",
      resumeUrl: data.links?.resumeUrl?.trim() ?? "",
    };

    await profile.save();
    return profile;
  }

  profile = await SeekerProfile.create({
    userId: userObjectId,
    headline: data.headline?.trim() ?? "",
    bio: data.bio?.trim() ?? "",
    skills: sanitizedSkills,
    experienceYears: data.experienceYears ?? 0,
    location: data.location?.trim() ?? "",
    links: {
      linkedin: data.links?.linkedin?.trim() ?? "",
      github: data.links?.github?.trim() ?? "",
      portfolio: data.links?.portfolio?.trim() ?? "",
      resumeUrl: data.links?.resumeUrl?.trim() ?? "",
    },
  });

  return profile;
}

const natural = require('natural');

const calculateMatchScore = (candidateSkills, jobRequiredSkills, candidateExperience, jobExperience) => {
  let score = 0;
  const weights = {
    skills: 0.7,
    experience: 0.3
  };

  const requiredSkillsLower = jobRequiredSkills.map(s => s.toLowerCase());
  const candidateSkillsLower = candidateSkills.map(s => s.toLowerCase());

  const matchedSkills = candidateSkillsLower.filter(skill =>
    requiredSkillsLower.some(reqSkill => 
      skill.includes(reqSkill) || reqSkill.includes(skill)
    )
  );

  const skillScore = jobRequiredSkills.length > 0
    ? (matchedSkills.length / jobRequiredSkills.length) * 100
    : 0;

  const expYears = candidateExperience?.years || 0;
  const reqExpYears = jobExperience || 0;
  const experienceScore = reqExpYears > 0
    ? Math.min((expYears / reqExpYears) * 100, 100)
    : 50;

  score = (skillScore * weights.skills) + (experienceScore * weights.experience);

  return Math.round(score);
};

const matchCandidatesWithJob = async (job, candidates) => {
  const jobSkills = extractJobSkills(job.description);
  const jobExperience = extractJobExperience(job.description);

  const scoredCandidates = candidates.map(candidate => {
    const resume = candidate.resume || {};
    const score = calculateMatchScore(
      resume.skills || [],
      jobSkills,
      resume.experience,
      jobExperience
    );

    return {
      ...candidate.toObject(),
      matchScore: score,
      matchedSkills: (resume.skills || []).filter(skill =>
        jobSkills.some(js => skill.toLowerCase().includes(js.toLowerCase()))
      )
    };
  });

  scoredCandidates.sort((a, b) => b.matchScore - a.matchScore);

  return scoredCandidates.slice(0, 10);
};

const extractJobSkills = (description) => {
  const skillsDatabase = [
    'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'Angular', 'Vue',
    'MongoDB', 'PostgreSQL', 'MySQL', 'AWS', 'Azure', 'Docker', 'Kubernetes',
    'Machine Learning', 'AI', 'Data Science', 'DevOps', 'CI/CD',
    'HTML', 'CSS', 'TypeScript', 'REST API', 'GraphQL', 'Git'
  ];

  const foundSkills = [];
  const lowerDesc = description.toLowerCase();

  skillsDatabase.forEach(skill => {
    if (lowerDesc.includes(skill.toLowerCase())) {
      foundSkills.push(skill);
    }
  });

  return foundSkills;
};

const extractJobExperience = (description) => {
  const expPattern = /(\d+)\s*\+?\s*(years?|yrs?)/gi;
  const matches = description.match(expPattern);
  
  if (matches && matches.length > 0) {
    return parseInt(matches[0].match(/\d+/)[0]);
  }

  return 0;
};

const getJobRecommendations = async (userSkills, allJobs) => {
  const scoredJobs = allJobs.map(job => {
    const jobSkills = extractJobSkills(job.description);
    const matchedSkills = userSkills.filter(skill =>
      jobSkills.some(js => skill.toLowerCase().includes(js.toLowerCase()))
    );

    const score = jobSkills.length > 0
      ? (matchedSkills.length / jobSkills.length) * 100
      : 0;

    return {
      ...job.toObject(),
      matchScore: Math.round(score),
      matchedSkills
    };
  });

  scoredJobs.sort((a, b) => b.matchScore - a.matchScore);

  return scoredJobs.filter(job => job.matchScore > 30).slice(0, 10);
};

module.exports = {
  calculateMatchScore,
  matchCandidatesWithJob,
  getJobRecommendations
};
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const getAllSkills = async () => {
  const res = await axios.get(`${API}/skills`);
  return res.data;
};

export const createSkill = async (data: {
  name: string;
  category: 'KNOWLEDGE' | 'KNOW_HOW' | 'SOFT';
  description?: string;
}) => {
  const res = await axios.post(`${API}/skills`, data);
  return res.data;
};

export const updateSkill = async (id: string, data: any) => {
  const res = await axios.patch(`${API}/skills/${id}`, data);
  return res.data;
};

export const deleteSkill = async (id: string) => {
  const res = await axios.delete(`${API}/skills/${id}`);
  return res.data;
};

export const assignSkill = async (data: {
  employeeId: string;
  skillId: string;
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXPERT';
  dynamicScore?: number;
}) => {
  const res = await axios.post(`${API}/skills/assign`, data);
  return res.data;
};

export const getEmployeeSkills = async (employeeId: string) => {
  const res = await axios.get(`${API}/skills/employee/${employeeId}`);
  return res.data;
};

export const updateEmployeeSkillLevel = async (
  employeeSkillId: string,
  data: {
    newLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXPERT';
    scoreDelta?: number;
    note?: string;
  },
) => {
  const res = await axios.patch(
    `${API}/skills/employee-skill/${employeeSkillId}/level`,
    data
  );
  return res.data;
};

export const getSkillEvolution = async (employeeSkillId: string) => {
  const res = await axios.get(
    `${API}/skills/employee-skill/${employeeSkillId}/evolution`
  );
  return res.data;
};
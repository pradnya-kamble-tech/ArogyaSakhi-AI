import model from './maternal_model.json';
import { createMaternalAssessor } from './maternalCore.js';

export const assessMaternal = createMaternalAssessor(model);

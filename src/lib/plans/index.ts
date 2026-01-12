import { fizikPlan } from './fizik';
import { edebiyatPlan } from './edebiyat';

export const ALL_PLANS: Record<string, any> = {
  'Fizik': {
    grades: ['9', '10', '11', '12'],
    data: fizikPlan,
  },
  'Edebiyat': {
    grades: ['0', '9', '10', '11', '12'],
    data: edebiyatPlan
  }
};

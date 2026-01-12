import { fizikPlan } from './fizik';

export const ALL_PLANS: Record<string, any> = {
  'Fizik': {
    grades: ['9', '10', '11', '12'],
    data: fizikPlan,
  },
  // Gelecekte yeni dersler buraya eklenebilir.
  // 'Edebiyat': {
  //   grades: ['9', '10'],
  //   data: edebiyatPlan
  // }
};

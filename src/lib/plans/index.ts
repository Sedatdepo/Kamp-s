import { plan9 as fizikPlan9 } from './data/fizik_9';
import { plan10 as fizikPlan10 } from './data/fizik_10';
import { plan11 as fizikPlan11 } from './data/fizik_11';
import { plan12 as fizikPlan12 } from './data/fizik_12';

import { planPrep as edebiyatPlanPrep } from './data/edebiyat_prep';
import { plan9 as edebiyatPlan9 } from './data/edebiyat_9';
import { plan10 as edebiyatPlan10 } from './data/edebiyat_10';
import { plan11 as edebiyatPlan11 } from './data/edebiyat_11';
import { plan12 as edebiyatPlan12 } from './data/edebiyat_12';

const fizikPlan = {
  '9': {
    data: fizikPlan9,
    filters: [
      { id: 'all', label: 'Tümü' },
      { id: 'fizik-bilimi', label: 'Fizik Bilimi' },
      { id: 'kuvvet-hareket', label: 'Kuvvet ve Hareket' },
      { id: 'akiskanlar', label: 'Akışkanlar' },
      { id: 'enerji', label: 'Enerji' }
    ]
  },
  '10': {
    data: fizikPlan10,
    filters: [
      { id: 'all', label: 'Tümü' },
      { id: 'kuvvet-hareket', label: 'Kuvvet' },
      { id: 'enerji', label: 'Enerji' },
      { id: 'elektrik', label: 'Elektrik' },
      { id: 'dalgalar', label: 'Dalgalar' }
    ]
  },
  '11': {
    data: fizikPlan11,
    filters: [
      { id: 'all', label: 'Tümü' },
      { id: 'kuvvet-hareket', label: 'Kuvvet' },
    ]
  },
  '12': {
    data: fizikPlan12,
    filters: [
      { id: 'all', label: 'Tümü' },
      { id: 'kuvvet-hareket', label: 'Kuvvet' },
    ]
  }
};

const edebiyatPlan = {
  '0': { data: edebiyatPlanPrep, filters: [ { id: 'all', label: 'Tümü' }, { id: 'tema1', label: 'Sanatın Dili' }, { id: 'tema2', label: 'Sözün Peşinde' }, { id: 'tema3', label: 'Okurun Dünyası' }, { id: 'tema4', label: 'Sözün Ebrusu' } ] },
  '9': { data: edebiyatPlan9, filters: [ { id: 'all', label: 'Tümü' }, { id: 'tema1', label: 'Sözün İnceliği' }, { id: 'tema2', label: 'Anlam Arayışı' }, { id: 'tema3', label: 'Anlamın Yapı Taşları' }, { id: 'tema4', label: 'Dilin Zenginliği' } ] },
  '10': { data: edebiyatPlan10, filters: [ { id: 'all', label: 'Tümü' }, { id: 'tema1', label: 'Sözün Ezgisi' }, { id: 'tema2', label: 'Kelimelerin Ritmi' }, { id: 'tema3', label: 'Dünden Bugüne' }, { id: 'tema4', label: 'Nesillerin Mirası' } ] },
  '11': { data: edebiyatPlan11, filters: [ { id: 'all', label: 'Tümü' }, { id: 'tema1', label: 'Bir Diyeceğim Var!' }, { id: 'tema2', label: 'Kültür Yolculuğu' }, { id: 'tema3', label: 'Yaşamın İzinde' }, { id: 'tema4', label: 'Hayatın Aynası' } ] },
  '12': { data: edebiyatPlan12, filters: [ { id: 'all', label: 'Tümü' }, { id: 'tema1', label: 'Benim Yolculuğum' }, { id: 'tema2', label: 'Toplumun Ahengi' }, { id: 'tema3', label: 'Hayatın Dengesi' }, { id: 'tema4', label: 'Hayalimdeki Yarın' } ] }
};

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

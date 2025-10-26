export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER'
}

export interface PassengerDTO {
  name: string;
  age: number;
  gender: Gender;
  phoneNumber: string;
}

/* eslint-disable class-methods-use-this */
import BaseObject from '../BaseObject';

export const TABLE_NAME = 'CATEGORY_LIST';

/**
 * TODO: Add documentation
 */
interface ICategoryApiModel {
  uid: number;
  categoryName: string;
  isSponsor: boolean;
}

export class Category extends BaseObject {

  public uid: number;
  public categoryName: string;
  public isSponsor: boolean;

  public get schema() {
    return null;
  }
  public get id() {
    return this.uid;
  }
  constructor(data: ICategoryApiModel) {
    super();
    this.uid = data.uid;
    this.categoryName = data.categoryName;
    this.isSponsor = data.isSponsor;
  }
}
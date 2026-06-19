import { Query } from "mongoose";

type TFilterQuery<T> = {
  [K in keyof T]?: any;
} & {
  $or?: TFilterQuery<T>[];
  $and?: TFilterQuery<T>[];
  [key: string]: any;
};

class QueryBuilder<T> {
  public modelQuery: Query<T[], T>;
  public query: Record<string, unknown>;

  constructor(modelQuery: Query<T[], T>, query: Record<string, unknown>) {
    this.modelQuery = modelQuery;
    this.query = query;
  }

  search(searchableFields: string[]) {
    const searchTerm = this.query?.searchTerm;
    if (searchTerm) {
      this.modelQuery = this.modelQuery.find({
        $or: searchableFields.map(
          (field) =>
          ({
            [field]: { $regex: searchTerm, $options: "i" },
          } as TFilterQuery<T>)
        ),
      } as TFilterQuery<T>);
    }

    return this;
  }

  filter() {
    const queryObj = { ...this.query };
    const excludeFields = ["searchTerm", "sort", "limit", "page", "fields"];

    excludeFields.forEach((el) => delete queryObj[el]);

    const cleanedQueryObj: Record<string, any> = {};

    const fromDate = queryObj['fromDate'];
    const toDate = queryObj['toDate'];

    if (fromDate || toDate) {
      const dateFilter: Record<string, any> = {};

      if (fromDate) {
        const start = new Date(fromDate as string);
        start.setHours(0, 0, 0, 0); 
        dateFilter['$gte'] = start;
      }

      if (toDate) {
        const end = new Date(toDate as string);
        end.setHours(23, 59, 59, 999); 
        dateFilter['$lte'] = end;
      }

      cleanedQueryObj['createdAt'] = dateFilter;
    }

    delete queryObj['fromDate'];
    delete queryObj['toDate'];

    Object.keys(queryObj).forEach((key) => {
      const value = queryObj[key];
      if (value !== undefined && value !== "" && value !== "undefined") {
        if (typeof value === 'string' && value.includes(',')) {
          cleanedQueryObj[key] = { $in: value.split(',') };
        } else {
          cleanedQueryObj[key] = value;
        }
      }
    });

    this.modelQuery = this.modelQuery.find(cleanedQueryObj as TFilterQuery<T>);

    return this;
  }

  sort() {
    const sort =
      (this.query?.sort as string)?.split(",")?.join(" ") || "-createdAt";
    this.modelQuery = this.modelQuery.sort(sort);
    return this;
  }

  paginate() {
    const page = Math.max(1, Number(this.query?.page) || 1);
    const limit = Math.max(1, Number(this.query?.limit) || 8);
    const skip = (page - 1) * limit;
    this.modelQuery = this.modelQuery.skip(skip).limit(limit);
    return this;
  }

  fields() {
    const fields =
      (this.query?.fields as string)?.split(",")?.join(" ") || "-__v";
    this.modelQuery = this.modelQuery.select(fields);
    return this;
  }

  async countTotal() {
    const totalQueries = this.modelQuery.getFilter();
    const total = await this.modelQuery.model.countDocuments(totalQueries);
    const page = Math.max(1, Number(this.query?.page) || 1);
    const limit = Math.max(1, Number(this.query?.limit) || 10);
    const totalPage = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPage,
    };
  }
}

export default QueryBuilder;
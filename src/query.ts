export enum QueryType {
    Link = "l",
    Tab = "t"
}

export class Query {

    private static parser: RegExp = /^(?:([lt])\s*:\s*)?(.*)/i;
    public static readonly EMPTY: Query = new Query("", undefined);

    private readonly _search: string;
    private readonly _type: QueryType | undefined;


    private constructor(search: string, type: QueryType | undefined) {
        this._search = search;
        this._type = type;

        if (type !== undefined && search === "") {
            this._search = "*";
        }
    }


    get search(): string {
        return this._search;
    }

    get type(): QueryType | undefined {
        return this._type;
    }

    public static parse(query: string) {
        let result: Array<string> = this.parser.exec(query);
        // @ts-ignore
        return new Query(result[2], result[1]);
    }

    equals(query: Query) {
        return query._search === this._search && query._type === this._type;
    }

}

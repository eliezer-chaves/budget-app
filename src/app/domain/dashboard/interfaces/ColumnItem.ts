import { NzTableSortOrder, NzTableSortFn, NzTableFilterList, NzTableFilterFn } from "ng-zorro-antd/table";
import { ItemData } from "@domain/dashboard/interfaces/ItemData";

export interface ColumnItem {
    name: string;
    sortOrder: NzTableSortOrder | null;
    sortDirections: NzTableSortOrder[];
    sortFn: NzTableSortFn<ItemData> | null;
    filterConfig?: {
        listOfFilter?: NzTableFilterList;
        filterFn?: NzTableFilterFn<ItemData>;
        filterMultiple?: boolean;
    };
}

"use client";

import { useMemo, useState } from "react";
import type { WarehouseStockData } from "../types";
import {
  calculateConditionByCategory,
  calculateStockByCondition,
  calculateTopItemTypes,
  calculateTypeStockModalData,
  calculateWarehouseKpis,
  filterBaseWarehouseItems,
  filterTableItems,
} from "../utils/warehouseStockTransformer";
import WarehouseStockKpisComponent from "./WarehouseStockKpis";
import WarehouseStockChartsComponent from "./WarehouseStockCharts";
import WarehouseStockTable from "./WarehouseStockTable";

interface WarehouseStockClientProps {
  initialData: WarehouseStockData;
}

export default function WarehouseStockClient({
  initialData,
}: WarehouseStockClientProps) {
  // Table & visual interaction filters
  const [category, setCategory] = useState<string>("Semua");
  const [condition, setCondition] = useState<string>("Semua");
  const [type, setType] = useState<string | null>(null);
  const [tableLocation, setTableLocation] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");

  // Stock status modal
  const [selectedTypeModal, setSelectedTypeModal] = useState<string | null>(
    null,
  );

  // Base items (all items without extra page-level toolbar)
  const baseItems = useMemo(
    () => filterBaseWarehouseItems(initialData.items, "Semua", "All Months"),
    [initialData.items],
  );

  // Aggregate visual models
  const kpis = useMemo(() => calculateWarehouseKpis(baseItems), [baseItems]);
  const conditionShares = useMemo(
    () => calculateStockByCondition(baseItems),
    [baseItems],
  );
  const categoryStacks = useMemo(
    () => calculateConditionByCategory(baseItems),
    [baseItems],
  );
  const topItemTypes = useMemo(
    () => calculateTopItemTypes(baseItems),
    [baseItems],
  );
  const allCategories = useMemo(
    () =>
      Array.from(
        new Set(baseItems.map((r) => r.category || "Uncategorized")),
      ).sort(),
    [baseItems],
  );

  // Modal status data
  const typeModalData = useMemo(
    () => calculateTypeStockModalData(baseItems, selectedTypeModal),
    [baseItems, selectedTypeModal],
  );

  // Table items filtered by table filters
  const tableItems = useMemo(
    () =>
      filterTableItems(baseItems, {
        category,
        condition,
        type,
        tableLocation,
        search,
      }),
    [baseItems, category, condition, type, tableLocation, search],
  );

  const isTableFiltered =
    category !== "Semua" ||
    condition !== "Semua" ||
    type !== null ||
    tableLocation !== null ||
    search.trim() !== "";

  const handleResetTableFilters = () => {
    setCategory("Semua");
    setCondition("Semua");
    setType(null);
    setTableLocation(null);
    setSearch("");
  };

  const handleSelectCategoryAndCondition = (
    newCat: string,
    newCond: string,
  ) => {
    setCategory(newCat);
    setCondition(newCond);
  };

  return (
    <div className="space-y-4">
      {/* 4 KPI Cards directly under header */}
      <WarehouseStockKpisComponent
        kpis={kpis}
        activeCondition={condition}
        activeTableLocation={tableLocation}
        onSelectCondition={(c) => {
          setCondition(c);
          setTableLocation(null);
        }}
        onSelectTableLocation={(loc) => {
          setTableLocation(loc);
          setCondition("Semua");
        }}
        onResetFilters={handleResetTableFilters}
      />

      {/* Charts Section: Donut + Top types, followed by Stacked bar */}
      <WarehouseStockChartsComponent
        conditionShares={conditionShares}
        totalUnits={kpis.totalUnits}
        categoryStacks={categoryStacks}
        topItemTypes={topItemTypes}
        typeModalData={typeModalData}
        activeCondition={condition}
        activeCategory={category}
        onSelectCondition={setCondition}
        onSelectCategory={setCategory}
        onSelectCategoryAndCondition={handleSelectCategoryAndCondition}
        onOpenTypeModal={setSelectedTypeModal}
        onCloseTypeModal={() => setSelectedTypeModal(null)}
      />

      {/* Detail Table Section */}
      <WarehouseStockTable
        items={tableItems}
        allCategories={allCategories}
        search={search}
        category={category}
        condition={condition}
        onSearchChange={setSearch}
        onCategoryChange={setCategory}
        onConditionChange={setCondition}
        onResetFilters={handleResetTableFilters}
        hasActiveFilters={isTableFiltered}
      />
    </div>
  );
}

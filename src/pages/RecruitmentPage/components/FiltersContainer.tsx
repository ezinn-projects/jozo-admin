import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import SearchInput from "./SearchInput";
import StatusFilter from "./StatusFilter";

interface FiltersContainerProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
}

const FiltersContainer: React.FC<FiltersContainerProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
}) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <SearchInput value={searchTerm} onChange={onSearchChange} />
          </div>
          <div className="w-full md:w-48">
            <StatusFilter value={statusFilter} onChange={onStatusChange} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FiltersContainer;

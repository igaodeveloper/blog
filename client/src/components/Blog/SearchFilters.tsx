import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface SearchFiltersProps {
  onSearch: (query: string) => void;
  onCategoryFilter: (category: string) => void;
  onSortChange: (sort: string) => void;
}

export default function SearchFilters({ onSearch, onCategoryFilter, onSortChange }: SearchFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useTranslation();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  const categories = [
    "Todas Categorias",
    "JavaScript",
    "Python",
    "React",
    "DevOps",
    "Machine Learning",
    "Frontend",
    "Backend",
    "Mobile",
    "Design",
  ];

  return (
    <div className="mb-8 flex flex-col md:flex-row gap-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder={t("home.searchPlaceholder")}
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full bg-gray-900 border-gray-700 pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors"
        />
      </div>
      
      <div className="flex gap-2">
        <Select onValueChange={onCategoryFilter}>
          <SelectTrigger className="w-48 bg-gray-900 border-gray-700 text-white focus:border-purple-500">
            <SelectValue placeholder={t("home.allCategories")} />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-700">
            {categories.map((category) => (
              <SelectItem 
                key={category} 
                value={category === "Todas Categorias" ? "" : category}
                className="text-white focus:bg-gray-800"
              >
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select onValueChange={onSortChange}>
          <SelectTrigger className="w-48 bg-gray-900 border-gray-700 text-white focus:border-purple-500">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-700">
            <SelectItem value="recent" className="text-white focus:bg-gray-800">
              Mais Recentes
            </SelectItem>
            <SelectItem value="popular" className="text-white focus:bg-gray-800">
              Mais Populares
            </SelectItem>
            <SelectItem value="likes" className="text-white focus:bg-gray-800">
              Mais Curtidos
            </SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="outline" className="bg-gray-900 border-gray-700 text-white hover:border-purple-500 transition-colors">
          <Filter className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

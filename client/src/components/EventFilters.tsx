import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface EventFiltersProps {
  onFiltersChange: (filters: {
    search?: string;
    category?: string;
    date?: string;
    location?: string;
  }) => void;
  initialFilters?: {
    search?: string;
    category?: string;
    date?: string;
    location?: string;
  };
}

export const EventFilters = ({ onFiltersChange, initialFilters = {} }: EventFiltersProps) => {
  const [search, setSearch] = useState(initialFilters.search || '');
  const [category, setCategory] = useState(initialFilters.category || 'all');
  const [date, setDate] = useState(initialFilters.date || 'all-time');
  const [location, setLocation] = useState(initialFilters.location || '');

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    },
  });

  useEffect(() => {
    const filters = {
      ...(search && { search }),
      ...(category && category !== 'all' && { category }),
      ...(date && date !== 'all-time' && { date }),
      ...(location && { location }),
    };
    onFiltersChange(filters);
  }, [search, category, date, location, onFiltersChange]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is already handled by the useEffect above
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('all');
    setDate('all-time');
    setLocation('');
  };

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <Input
              type="text"
              placeholder="Search events, locations, organizers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>
          
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {(categories as any[]).map((cat: any) => (
                <SelectItem key={cat.id} value={cat.slug}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={date} onValueChange={setDate}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="This Week" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-time">This Week</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="tomorrow">Tomorrow</SelectItem>
              <SelectItem value="this-weekend">This Weekend</SelectItem>
              <SelectItem value="next-week">Next Week</SelectItem>
            </SelectContent>
          </Select>
          
          <Button type="submit" className="px-6">
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
          
          {(search || category || date || location) && (
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

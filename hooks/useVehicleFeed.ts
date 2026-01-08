import { useState, useEffect, useCallback, useRef } from 'react';
import apiService from '../services/apiService';
import { FilterState } from '../components/FilterModal';

export const useVehicleFeed = () => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentFilters, setCurrentFilters] = useState<FilterState>({});
  
  // Store all fetched data to handle client-side pagination
  // since the API currently returns all results
  const allVehiclesRef = useRef<any[]>([]);
  const pageRef = useRef(1);
  const PAGE_SIZE = 10;

  const loadVehicles = useCallback(async (pageNum = 1, shouldRefresh = false, filters: FilterState = {}) => {
    if (pageNum === 1) setLoading(true);
    
    try {
      // Only fetch from API on first page or refresh or when filters change
      if (shouldRefresh || pageNum === 1) {
        const data = await apiService.getPublications(filters);
        allVehiclesRef.current = data;
        pageRef.current = 1;
      } else {
        pageRef.current = pageNum;
      }
      
      const currentData = allVehiclesRef.current;
      const slicedData = currentData.slice(0, pageRef.current * PAGE_SIZE);
      
      setVehicles(slicedData);
      setHasMore(slicedData.length < currentData.length);
      
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const applyFilters = (newFilters: FilterState) => {
    setCurrentFilters(newFilters);
    loadVehicles(1, true, newFilters);
  };

  useEffect(() => {
    loadVehicles(1, false, currentFilters);
  }, []); // Initial load

  const onRefresh = () => {
    setRefreshing(true);
    loadVehicles(1, true, currentFilters);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadVehicles(pageRef.current + 1, false, currentFilters);
    }
  };

  return {
    vehicles,
    loading,
    refreshing,
    onRefresh,
    loadMore,
    applyFilters,
    currentFilters
  };
};

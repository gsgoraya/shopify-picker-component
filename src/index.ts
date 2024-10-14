import React, { useEffect, useRef, useState } from 'react';
import { create, Action } from '@shopify/app-bridge/actions/Picker';
import { useAppBridge } from '@shopify/app-bridge-react';
import { AppConfigV2, createApp } from '@shopify/app-bridge';

// Type definition for Picker component props
type PickerProps = {
  open: boolean;
  onCancel?: () => void;
  onSelect?: (...args: any[]) => void;
  onSearch?: (...args: any[]) => void;
  onLoadMore?: (...args: any[]) => void;
  [key: string]: any;
};

const Picker: React.FC<PickerProps> = ({ open, onCancel, onSelect, onSearch, onLoadMore, ...options }) => {
  const shopify = useAppBridge();

  // References to keep track of component state and options
  const isUnmountedRef = useRef(false); // Tracks whether component is unmounted
  const openRef = useRef(false); // Tracks the current open state of the picker
  const optionsRef = useRef(options); // Tracks the options for the picker
  const [picker, setPicker] = useState<any>(null); // State for storing the picker instance

  // Create picker instance when component mounts
  useEffect(() => {
	// @ts-ignore
    const app = createApp(shopify.config as AppConfigV2); // Create the Shopify App Bridge instance
    const picker = create(app, optionsRef.current as any); // Create the picker instance using the app bridge
    setPicker(picker); // Store the picker instance in state
  }, [shopify]);

  // Handle component unmounting and clean up
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true; // Mark the component as unmounted
      if (openRef.current && picker) {
        picker.dispatch(Action.CANCEL); // Cancel picker action if still open during unmount
      }
    };
  }, [picker]);

  // Manage the "open" state of the picker
  useEffect(() => {
    if (open === openRef.current) return; // If open state hasn't changed, do nothing
    openRef.current = open; // Update the reference to the current open state
    if (open && picker) {
      picker.dispatch(Action.OPEN); // Open the picker
    } else if (picker) {
      picker.dispatch(Action.CANCEL); // Cancel/close the picker
    }
  }, [picker, open]);

  // Subscribe to picker events and handle callbacks
  useEffect(() => {
    if (!onSelect || !picker) return;
    return picker.subscribe(Action.SELECT, (...args: any[]) => {
      openRef.current = false; // Update the open state reference when an item is selected
      onSelect(...args); // Call the onSelect callback with the selected arguments
    });
  }, [picker, onSelect]);

  useEffect(() => {
    if (!onCancel || !picker) return;
    return picker.subscribe(Action.CANCEL, () => {
      openRef.current = false; // Update the open state reference when the picker is cancelled
      onCancel(); // Call the onCancel callback
    });
  }, [picker, onCancel]);

  useEffect(() => {
    if (!onSearch || !picker) return;
    return picker.subscribe(Action.SEARCH, onSearch); // Subscribe to the search action and call the onSearch callback
  }, [picker, onSearch]);

  useEffect(() => {
    if (!onLoadMore || !picker) return;
    return picker.subscribe(Action.LOAD_MORE, onLoadMore); // Subscribe to the load more action and call the onLoadMore callback
  }, [picker, onLoadMore]);

  // Update picker options if they change
  useEffect(() => {
    const shouldUpdate = JSON.stringify(options) !== JSON.stringify(optionsRef.current); // Check if options have changed
    if (!shouldUpdate) return; // If options haven't changed, do nothing
    optionsRef.current = options; // Update the reference to the current options
    if (picker) {
      picker.set(options, openRef.current); // Update the picker options with the new values
    }
  }, [picker, options]);

  return null; // Component does not render any visible content
};

export default Picker;
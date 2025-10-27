import { toast } from "react-toastify";

export class NotificationAdapter {
  static success(message: string, options?: NotificationOptions): void {
    toast.success(message, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options,
    });
  }

  static error(message: string, options?: NotificationOptions): void {
    toast.error(message, {
      position: "top-right",
      autoClose: 7000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options,
    });
  }

  static warning(message: string, options?: NotificationOptions): void {
    toast.warning(message, {
      position: "top-right",
      autoClose: 6000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options,
    });
  }

  static info(message: string, options?: NotificationOptions): void {
    toast.info(message, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options,
    });
  }
  static loading(
    message: string,
    options?: NotificationOptions
  ): string | number {
    return toast.loading(message, {
      position: "top-right",
      closeOnClick: false,
      pauseOnHover: false,
      draggable: false,
      ...options,
    });
  }

  static update(
    id: string | number,
    message: string,
    type: "success" | "error" | "warning" | "info" = "info",
    options?: NotificationOptions
  ): void {
    const updateOptions = {
      render: message,
      type,
      isLoading: false,
      autoClose: type === "error" ? 7000 : 5000,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options,
    };

    toast.update(id, updateOptions);
  }

  static dismiss(id: string | number): void {
    toast.dismiss(id);
  }

  static dismissAll(): void {
    toast.dismiss();
  }

  static isActive(id: string | number): boolean {
    return toast.isActive(id);
  }
}

export interface NotificationOptions {
  autoClose?: number | false;
  position?:
    | "top-left"
    | "top-right"
    | "top-center"
    | "bottom-left"
    | "bottom-right"
    | "bottom-center";
  hideProgressBar?: boolean;
  closeOnClick?: boolean;
  pauseOnHover?: boolean;
  draggable?: boolean;
  theme?: "light" | "dark" | "colored";
  className?: string;
  bodyClassName?: string;
  progressClassName?: string;
}

export const notify = NotificationAdapter;

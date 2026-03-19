import React, { useRef, useState } from "react";
import { AlertModal } from "../components/common/AlertModal";
import { ToastAlert } from "../components/common/ToastAlert";

// 전역 상태 관리용
let alertResolver: ((value: boolean) => void) | null = null;

interface AlertState {
  visible: boolean;
  type: "success" | "error" | "info" | "question" | "warning";
  title?: string;
  text?: string;
  showConfirmButton: boolean;
  showCancelButton: boolean;
  confirmButtonText: string;
  cancelButtonText: string;
  confirmButtonColor: string;
  cancelButtonColor: string;
  timer?: number;
}

interface ToastState {
  visible: boolean;
  type: "success" | "error" | "info" | "warning";
  title: string;
  duration: number;
}

export const useAlert = () => {
  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    type: "info",
    showConfirmButton: true,
    showCancelButton: false,
    confirmButtonText: "확인",
    cancelButtonText: "취소",
    confirmButtonColor: "#3b82f6",
    cancelButtonColor: "#9ca3af",
  });

  const [toastState, setToastState] = useState<ToastState>({
    visible: false,
    type: "success",
    title: "",
    duration: 2500,
  });

  const closeAlert = () => {
    setAlertState((prev) => ({ ...prev, visible: false }));
  };

  const closeToast = () => {
    setToastState((prev) => ({ ...prev, visible: false }));
  };

  // 🔴 에러 핸들링
  const sweetErrorHandling = (err: any) => {
    setAlertState({
      visible: true,
      type: "error",
      text: err.message,
      showConfirmButton: false,
      showCancelButton: false,
      confirmButtonText: "확인",
      cancelButtonText: "취소",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#9ca3af",
      timer: 3000,
    });
  };

  // ✅ 성공 토스트
  const sweetTopSuccessAlert = (msg: string, duration: number = 2000) => {
    setToastState({ visible: true, type: "success", title: msg, duration });
  };

  // ✅ 성공 토스트 (mixin)
  const sweetMixinSuccessAlert = (msg: string, duration: number = 2000) => {
    setToastState({ visible: true, type: "success", title: msg, duration });
  };

  // 🔴 에러 토스트
  const sweetErrorAlert = (msg: string, duration: number = 3000) => {
    setToastState({ visible: true, type: "error", title: msg, duration });
  };

  // 🔴 에러 토스트 (mixin)
  const sweetMixinErrorAlert = (msg: string, duration: number = 3000) => {
    setToastState({ visible: true, type: "error", title: msg, duration });
  };

  // ❓ 확인 다이얼로그
  const sweetConfirmAlert = (msg: string): Promise<boolean> => {
    return new Promise((resolve) => {
      alertResolver = resolve;
      setAlertState({
        visible: true,
        type: "question",
        text: msg,
        showConfirmButton: true,
        showCancelButton: true,
        confirmButtonText: "확인",
        cancelButtonText: "취소",
        confirmButtonColor: "#e92C28",
        cancelButtonColor: "#bdbdbd",
      });
    });
  };

  // 🔐 로그인 확인 다이얼로그
  const sweetLoginConfirmAlert = (msg: string): Promise<boolean> => {
    return new Promise((resolve) => {
      alertResolver = resolve;
      setAlertState({
        visible: true,
        type: "question",
        text: msg,
        showConfirmButton: true,
        showCancelButton: true,
        confirmButtonText: "로그인",
        cancelButtonText: "취소",
        confirmButtonColor: "#e92C28",
        cancelButtonColor: "#bdbdbd",
      });
    });
  };

  // ℹ️ 기본 알림
  const sweetBasicAlert = (text: string) => {
    setAlertState({
      visible: true,
      type: "info",
      text,
      showConfirmButton: true,
      showCancelButton: false,
      confirmButtonText: "확인",
      cancelButtonText: "취소",
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#9ca3af",
    });
  };

  // 📞 연락 알림
  const sweetContactAlert = (msg: string, duration: number = 10000) => {
    setAlertState({
      visible: true,
      type: "info",
      title: msg,
      showConfirmButton: false,
      showCancelButton: false,
      confirmButtonText: "확인",
      cancelButtonText: "취소",
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#9ca3af",
      timer: duration,
    });
  };

  const AlertComponent = (
    <>
      <AlertModal
        {...alertState}
        onConfirm={() => {
          alertResolver?.(true);
          alertResolver = null;
          closeAlert();
        }}
        onCancel={() => {
          alertResolver?.(false);
          alertResolver = null;
          closeAlert();
        }}
        onClose={() => {
          alertResolver?.(false);
          alertResolver = null;
          closeAlert();
        }}
      />
      <ToastAlert {...toastState} onHide={closeToast} />
    </>
  );

  return {
    AlertComponent,
    sweetErrorHandling,
    sweetTopSuccessAlert,
    sweetMixinSuccessAlert,
    sweetErrorAlert,
    sweetMixinErrorAlert,
    sweetConfirmAlert,
    sweetLoginConfirmAlert,
    sweetBasicAlert,
    sweetContactAlert,
  };
};

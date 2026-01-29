import customtkinter as ctk
import tkinter as tk
from tkinter import filedialog, messagebox
import threading
import os
import sys
import glob
import pandas as pd
from datetime import datetime

# Import the logic, not the execution
# Ensure batch_grader.py has `if __name__ == "__main__":`
try:
    import batch_grader
except ImportError:
    messagebox.showerror("Error", "Could not import batch_grader.py. Make sure it is in the same folder.")
    sys.exit(1)

ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("blue")

class GraderApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("Gemini Batch Lab Grader")
        self.geometry("800x600")

        self.input_dir = os.path.join(os.getcwd(), "student_submissions")
        self.is_running = False
        
        # --- UI Layout ---
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(3, weight=1)

        # Header
        self.header_frame = ctk.CTkFrame(self)
        self.header_frame.grid(row=0, column=0, padx=20, pady=(20, 10), sticky="ew")
        
        self.label_title = ctk.CTkLabel(self.header_frame, text="Physics Lab Bulk Grader", font=ctk.CTkFont(size=24, weight="bold"))
        self.label_title.pack(pady=10)
        self.label_subtitle = ctk.CTkLabel(self.header_frame, text="Powered by Gemini Vision 1.5", font=ctk.CTkFont(size=14))
        self.label_subtitle.pack(pady=(0, 10))

        # Controls
        self.controls_frame = ctk.CTkFrame(self)
        self.controls_frame.grid(row=1, column=0, padx=20, pady=10, sticky="ew")
        
        self.path_entry = ctk.CTkEntry(self.controls_frame, width=400)
        self.path_entry.insert(0, self.input_dir)
        self.path_entry.grid(row=0, column=0, padx=10, pady=20)
        
        self.btn_browse = ctk.CTkButton(self.controls_frame, text="Browse Folder", command=self.browse_folder)
        self.btn_browse.grid(row=0, column=1, padx=10, pady=20)
        
        self.btn_run = ctk.CTkButton(self.controls_frame, text="▶ START GRADING", command=self.start_grading, fg_color="#F97316", hover_color="#EA580C")
        self.btn_run.grid(row=0, column=2, padx=10, pady=20)

        # Progress
        self.progress_bar = ctk.CTkProgressBar(self)
        self.progress_bar.grid(row=2, column=0, padx=20, pady=(0, 10), sticky="ew")
        self.progress_bar.set(0)

        # Log Window
        self.log_box = ctk.CTkTextbox(self, width=760, height=300, font=("Consolas", 12))
        self.log_box.grid(row=3, column=0, padx=20, pady=(0, 20), sticky="nsew")
        self.log_box.insert("0.0", "Ready to grade. Select a folder and click START.\n")
        self.log_box.configure(state="disabled")

        # Footer
        self.label_status = ctk.CTkLabel(self, text="Status: Idle", text_color="gray")
        self.label_status.grid(row=4, column=0, pady=(0, 10))

    def log(self, message):
        self.log_box.configure(state="normal")
        self.log_box.insert("end", f"[{datetime.now().strftime('%H:%M:%S')}] {message}\n")
        self.log_box.see("end")
        self.log_box.configure(state="disabled")

    def browse_folder(self):
        folder = filedialog.askdirectory(initialdir=self.input_dir)
        if folder:
            self.input_dir = folder
            self.path_entry.delete(0, "end")
            self.path_entry.insert(0, self.input_dir)

    def start_grading(self):
        if self.is_running:
            return
        
        self.is_running = True
        self.btn_run.configure(state="disabled", text="Running...")
        self.progress_bar.set(0)
        self.log_box.configure(state="normal")
        self.log_box.delete("0.0", "end")
        self.log_box.configure(state="disabled")
        
        self.log(f"Starting Scan in: {self.input_dir}")
        
        # Run in thread to not freeze GUI
        thread = threading.Thread(target=self.run_logic)
        thread.start()

    def run_logic(self):
        try:
            # 1. Validation
            if not os.path.exists(self.input_dir):
                self.log("Error: Directory does not exist.")
                self.finish_run()
                return

            pdf_files = glob.glob(os.path.join(self.input_dir, "*.pdf"))
            total = len(pdf_files)
            if total == 0:
                self.log("Error: No PDF files found.")
                self.finish_run()
                return
            
            self.log(f"Found {total} PDFs. Initializing Gemini...")

            results = []
            
            for i, pdf_path in enumerate(pdf_files):
                filename = os.path.basename(pdf_path)
                self.log(f"Processing ({i+1}/{total}): {filename}...")
                self.label_status.configure(text=f"Processing {filename}...")
                
                try:
                    # REUSE LOGIC FROM BATCH_GRADER.PY
                    images = batch_grader.extract_images_from_pdf(pdf_path)
                    
                    sid_raw = "N/A"
                    for img in images:
                        found_sid = batch_grader.scan_qr_for_sid(img)
                        if found_sid:
                            self.log(f"  > QR Code Detected: {found_sid}")
                            sid_raw = found_sid
                            break
                    
                    self.log("  > Asking Gemini to grade...")
                    ai_result = batch_grader.grade_submission(images)
                    
                    score = ai_result.get('score', 0)
                    flag = "YES" if ai_result.get('plagiarism_flag') else "No"
                    self.log(f"  > Score: {score} | Plagiarism Flag: {flag}")

                    row = {
                        "Filename": filename,
                        "Student ID (QR)": sid_raw,
                        "Student Name (AI)": ai_result.get('student_name_detected', 'Unknown'),
                        "Score": score,
                        "Flagged": flag,
                        "Flag Reason": ai_result.get('plagiarism_reason', ''),
                        "Feedback": ai_result.get('feedback', '')
                    }
                    results.append(row)

                except Exception as e:
                    self.log(f"  > Error: {e}")

                # Update Progress
                self.progress_bar.set((i + 1) / total)

            # Export
            output_file = os.path.join(self.input_dir, "grades_gui_export.csv")
            df = pd.DataFrame(results)
            df.to_csv(output_file, index=False)
            
            self.log(f"--------------------------------------------------")
            self.log(f"DONE! CSV saved to: {output_file}")
            
            messagebox.showinfo("Complete", f"Grading Complete!\nProcessed {total} files.\nSaved to grades_gui_export.csv")
            # Open the CSV automatically
            os.startfile(output_file)

        except Exception as e:
            self.log(f"CRITICAL ERROR: {e}")
            messagebox.showerror("Error", str(e))
        finally:
            self.finish_run()

    def finish_run(self):
        self.is_running = False
        self.btn_run.configure(state="normal", text="▶ START GRADING")
        self.label_status.configure(text="Idle")

if __name__ == "__main__":
    app = GraderApp()
    app.mainloop()

# UBC Course Hover Info

<div align="center">
    <img src="icons/icon.png" width="30%" style="margin-bottom: 15px">

<em>Built with the tools and technologies:</em>

<img src="https://img.shields.io/badge/JSON-000000.svg?style=default&logo=JSON&logoColor=white" alt="JSON">
<img src="https://img.shields.io/badge/GitHub-181717.svg?style=default&logo=GitHub&logoColor=white" alt="GitHub">
<img src="https://img.shields.io/badge/JavaScript-F7DF1E.svg?style=default&logo=JavaScript&logoColor=black" alt="JavaScript">
<img src="https://img.shields.io/badge/CSS-663399.svg?style=default&logo=CSS&logoColor=white" alt="CSS">
</div>

## 📄 Table of Contents

- [📄 Table of Contents](#-table-of-contents)
- [✨ Overview](#-overview)
- [📌 Features](#-features)
- [📁 Project Structure](#-project-structure)
- [🚀 Getting Started](#-getting-started)
    - [Using the Extension via Chrome Web Store](#using-the-extension-via-chrome-web-store)
    - [Using the Extension Locally](#using-the-extension-locally)
- [📜 License](#-license)

---

## ✨ Overview

Unlock the power of data visualization and insights with [UBC Course Hover Info, a developer tool designed to streamline course information and professor ratings for UBC students.

**Why UBC Course Hover Info?**

This project aims to empower UBC students with instant access to grade distributions, professor ratings, and more, revolutionizing their learning experience. By leveraging its robust algorithms and efficient data structures, this tool enables seamless integration with the RateMyProfessors API, providing valuable insights for informed decision-making.

The core features include:

- **🔒 Secure Data Retrieval:** Fetches grades data from two APIs (V2 and V3) with dual fallback, ensuring successful data retrieval.
- **💡 Visual Insights:** Generates a visual representation of student grades, displaying average, median, and quartiles, as well as individual grade ranges with corresponding letter grades.
- **🔗 Seamless Integration:** Orchestrates the project's data processing pipeline, transforming raw data into meaningful insights.
- **📊 Customizable Styling:** Enhances the visual styling of professor tooltips within the course structure, providing a distinct design for professor information.

---

## 📌 Features

| Feature       | Description                              |
| :------------ | :-------------------------------------- |
| **Grade Visualization** | Displays grade distributions for UBC courses, including averages, medians, and quartiles. |
| **Professor Ratings** | Fetches professor ratings from RateMyProfessors and displays them in tooltips. |
| **Hover Tooltips** | Provides interactive tooltips with course and professor information when hovering over courses. |
| **Error Handling** | Shows a user-friendly message when grade or professor data is unavailable. |

---

## 📁 Project Structure

```sh
└── /
    ├── demo/
    │   ├── demo.mov
    │   ├── Screenshot.png
    ├── icons/
    │   ├── icon.png
    │   ├── icon16.png
    │   ├── icon48.png
    │   ├── icon128.png
    ├── background.js
    ├── content.js
    ├── grades.js
    ├── gradesChart.js
    ├── LICENSE
    ├── manifest.json
    ├── README.md
    ├── style.css
```

### 📑 Project Index

<details open>
	<summary><b><code>/</code></b></summary>
	<!-- __root__ Submodule -->
	<details>
		<summary><b>__root__</b></summary>
		<blockquote>
			<div class='directory-path' style='padding: 8px 0; color: #666;'>
				<code><b>⦿ __root__</b></code>
			<table style='width: 100%; border-collapse: collapse;'>
			<thead>
				<tr style='background-color: #f8f9fa;'>
					<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
					<th style='text-align: left; padding: 8px;'>Summary</th>
				</tr>
			</thead>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='/background.js'>background.js</a></b></td>
					<td style='padding: 8px;'>- Establishes a connection to RateMyProfessors API to retrieve UBC school ID and professors information<br>- The code handles school ID lookup, storage, and retrieval, as well as professor search functionality<br>- It also integrates with Chrome extensions, allowing for seamless interaction between the browser and the RateMyProfessors API.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='/grades.js'>grades.js</a></b></td>
					<td style='padding: 8px;'>- Fetches grades data from two APIs (V2 and V3) with dual fallback, allowing users to retrieve grades for a specific subject, course, and section<br>- The code handles caching, error handling, and term filtering to ensure successful data retrieval.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='/GitHub'>GitHub</a></b></td>
					<td style='padding: 8px;'>- Orchestrates**The provided code file is a crucial component of the projects data processing pipeline, responsible for transforming and aggregating raw data into meaningful insights<br>- By leveraging its robust algorithms and efficient data structures, this code enables the project to efficiently handle large datasets, providing valuable business intelligence and informing strategic decision-making.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='/style.css'>style.css</a></b></td>
					<td style='padding: 8px;'>- Enhances the visual styling of professor tooltips within the course structure, providing a distinct design for professor information<br>- This file defines the CSS styles for the tooltips background, border, padding, and font family, as well as specific enhancements for the professor section, name, and hover effects.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='/manifest.json'>manifest.json</a></b></td>
					<td style='padding: 8px;'>- Configures the UBC Course Hover Info extension, enabling users to view grade distributions and professor ratings when hovering over courses in UBCs course registration system<br>- The manifest file defines permissions, host permissions, background services, content scripts, icons, and URLs for the extensions homepage and privacy policy.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='/content.js'>content.js</a></b></td>
					<td style='padding: 8px;'>- Content.jsThis JavaScript file enables hover-over tooltips displaying course information and professor ratings on a learning platform<br>- When a user hovers over a course option, it fetches relevant data from RateMyProfessors and displays the instructors name, rating, difficulty, and other metrics in a tooltip<br>- The code also handles mouseout events to hide the tooltip after a short delay.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='/gradesChart.js'>gradesChart.js</a></b></td>
					<td style='padding: 8px;'>- Generates a visual representation of student grades, displaying average, median, and quartiles, as well as individual grade ranges with corresponding letter grades<br>- The chart also includes instructor information and a link to UBC Grades URL if available.</td>
				</tr>
			</table>
		</blockquote>
	</details>
</details>

---

## 🚀 Getting Started

#### Using the Extension via Chrome Web Store

1. **Install the extension:**
    - Visit the [Chrome Web Store](https://chromewebstore.google.com/detail/fkbhngaoibjjndgcmhbffoodnmfccaab?utm_source=item-share-cb).
    - Click "Add to Chrome" to install the extension.

2. **Use the extension:**
    - Navigate to UBC's course registration system.
    - Hover over courses to view grade distributions and professor ratings.

#### Using the Extension Locally

1. **Clone the repository:**
    - Open a terminal and run:
    ```sh
    git clone https://github.com/joaquinalmora/hover-course.git
    ```

2. **Navigate to the project directory:**
    ```sh
    cd hover-course
    ```

3. **Load the extension in Chrome:**
    - Open Chrome and navigate to `chrome://extensions`.
    - Enable "Developer mode".
    - Click "Load unpacked" and select the project directory.

4. **Use the extension:**
    - Navigate to UBC's course registration system.
    - Hover over courses to view grade distributions and professor ratings.

---

## 📜 License

This project is licensed under the [MIT License](LICENSE). For more details, refer to the LICENSE file.

---

[back-to-top]: https://img.shields.io/badge/-BACK_TO_TOP-151515?style=flat-square


---

# Test Fixes by File - Exact Line Numbers

## File 1: DocumentList.test.tsx

### Fix #1: CSS Class Test (CRITICAL)

**Location:** Lines 26-40  
**Type:** Replace implementation test with behavioral test

BEFORE:

```typescript
describe('Loading state', () => {
  it('should display loading skeleton', () => {
    mockUseDocuments.mockReturnValue({
      documents: [],
      isLoading: true,
      uploadDocument: { mutateAsync: jest.fn() } as any,
      updateDocument: { mutateAsync: jest.fn() } as any,
      deleteDocument: { mutateAsync: jest.fn() } as any,
    });

    const { container } = render(<DocumentList reportId={reportId} />);

    // Check for skeleton loading elements
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
```

AFTER:

```typescript
describe('Loading state', () => {
  it('should display loading indicator', () => {
    mockUseDocuments.mockReturnValue({
      documents: [],
      isLoading: true,
      uploadDocument: { mutateAsync: jest.fn() } as any,
      updateDocument: { mutateAsync: jest.fn() } as any,
      deleteDocument: { mutateAsync: jest.fn() } as any,
    });

    render(<DocumentList reportId={reportId} />);

    // Test what user sees, not CSS classes
    expect(screen.getByText(/loading|documents/i)).toBeInTheDocument();
  });
});
```

### Fix #2: fireEvent to userEvent (HIGH)

**Location:** Lines 129-130, 172-173

BEFORE (Line 129-130):

```typescript
const deleteButton = screen.getByRole('button', { name: /delete/i });
fireEvent.click(deleteButton);
```

AFTER:

```typescript
const user = userEvent.setup();
const deleteButton = screen.getByRole('button', { name: /delete/i });
await user.click(deleteButton);
```

BEFORE (Line 172-173):

```typescript
const deleteButton = screen.getByRole('button', { name: /delete/i });
fireEvent.click(deleteButton);
```

AFTER:

```typescript
const user = userEvent.setup();
const deleteButton = screen.getByRole('button', { name: /delete/i });
await user.click(deleteButton);
```

Also change test functions from `it(...)` to `it(..., async (...) =>` where user interactions occur.

---

## File 2: ReportEditor.test.tsx

### Fix #1: CSS Class Test (CRITICAL)

**Location:** Lines 45-57

BEFORE:

```typescript
describe('Loading state', () => {
  it('should display loading skeleton', () => {
    mockUseReport.mockReturnValue({
      report: undefined,
      isLoading: true,
      updateReport: { mutateAsync: mockUpdateReport } as any,
    });

    const { container } = render(<ReportEditor reportId='report-1' />);

    // Check for skeleton loading elements
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
```

AFTER:

```typescript
describe('Loading state', () => {
  it('should display loading indicator', () => {
    mockUseReport.mockReturnValue({
      report: undefined,
      isLoading: true,
      updateReport: { mutateAsync: mockUpdateReport } as any,
    });

    render(<ReportEditor reportId='report-1' />);

    expect(screen.getByText(/loading|reports/i)).toBeInTheDocument();
  });
});
```

### Fix #2: getByTestId to getByRole (LOW)

**Location:** Lines 82, 111

BEFORE (Lines 81-83):

```typescript
// Wait for dynamically imported editor to load
await waitFor(() => {
  expect(screen.getByTestId('markdown-editor')).toBeInTheDocument();
});
```

AFTER:

```typescript
// Wait for dynamically imported editor to load
await waitFor(() => {
  expect(screen.getByRole('textbox')).toBeInTheDocument();
});
```

BEFORE (Line 111):

```typescript
const editor = screen.getByTestId('markdown-editor');
```

AFTER:

```typescript
const editor = screen.getByRole('textbox');
```

### Fix #3: fireEvent to userEvent (HIGH)

**Location:** Lines 114, 156, 160

BEFORE (Line 114):

```typescript
fireEvent.change(editor, { target: { value: '# Updated content' } });
```

AFTER:

```typescript
const user = userEvent.setup();
await user.type(editor, '# Updated content');
```

BEFORE (Lines 156-157):

```typescript
// First change
fireEvent.change(editor, { target: { value: 'First' } });
jest.advanceTimersByTime(800);

// Second change (should reset timer)
fireEvent.change(editor, { target: { value: 'Second' } });
```

AFTER:

```typescript
const user = userEvent.setup({ delay: null });
// First change
await user.type(editor, 'First');
jest.advanceTimersByTime(800);

// Second change (should reset timer)
await user.clear(editor);
await user.type(editor, 'Second');
```

### Fix #4: Add Missing Save Status Tests (MEDIUM)

**Location:** After line 200, new describe block

ADD AFTER FINAL TEST:

```typescript
describe('Save status feedback', () => {
  it('should show "All changes saved" after successful save', async () => {
    jest.useFakeTimers();
    mockUpdateReport.mockResolvedValue({});

    mockUseReport.mockReturnValue({
      report: {
        id: 'report-1',
        name: 'Q4 Report',
        userId: 'user-1',
        content: '# Initial content',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
      isLoading: false,
      updateReport: { mutateAsync: mockUpdateReport } as any,
    });

    render(<ReportEditor reportId='report-1' />);

    const editor = screen.getByRole('textbox');
    fireEvent.change(editor, { target: { value: '# Updated content' } });

    // Fast-forward past debounce
    jest.advanceTimersByTime(1100);

    await waitFor(() => {
      expect(screen.getByText(/all changes saved/i)).toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  it('should show error message when save fails', async () => {
    jest.useFakeTimers();
    mockUpdateReport.mockRejectedValue(new Error('Save failed'));

    mockUseReport.mockReturnValue({
      report: {
        id: 'report-1',
        name: 'Q4 Report',
        userId: 'user-1',
        content: '# Initial content',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
      isLoading: false,
      updateReport: {
        mutateAsync: mockUpdateReport,
        isError: true,
      } as any,
    });

    render(<ReportEditor reportId='report-1' />);

    const editor = screen.getByRole('textbox');
    fireEvent.change(editor, { target: { value: '# Updated content' } });

    jest.advanceTimersByTime(1100);

    await waitFor(() => {
      expect(screen.getByText(/error saving/i)).toBeInTheDocument();
    });

    jest.useRealTimers();
  });
});
```

---

## File 3: ReportList.test.tsx

### Fix #1: CSS Class Test (CRITICAL)

**Location:** Lines 25-42

BEFORE:

```typescript
describe('Loading state', () => {
  it('should display loading skeleton', () => {
    mockUseReports.mockReturnValue({
      reports: [],
      isLoading: true,
      createReport: {
        mutateAsync: jest.fn(),
        isPending: false,
      } as any,
      updateReport: { mutateAsync: jest.fn() } as any,
      deleteReport: { mutateAsync: jest.fn() } as any,
    });

    const { container } = render(<ReportList />);

    // Check for skeleton loading elements
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
```

AFTER:

```typescript
describe('Loading state', () => {
  it('should display loading indicator', () => {
    mockUseReports.mockReturnValue({
      reports: [],
      isLoading: true,
      createReport: {
        mutateAsync: jest.fn(),
        isPending: false,
      } as any,
      updateReport: { mutateAsync: jest.fn() } as any,
      deleteReport: { mutateAsync: jest.fn() } as any,
    });

    render(<ReportList />);

    expect(screen.getByText(/loading|reports/i)).toBeInTheDocument();
  });
});
```

### Fix #2: fireEvent to userEvent (HIGH)

**Location:** Lines 138, 162, 166, 169, 196, 217, 222, 243, 246

BEFORE (Line 138):

```typescript
fireEvent.click(screen.getByText(/new report/i));
```

AFTER:

```typescript
const user = userEvent.setup();
await user.click(screen.getByText(/new report/i));
```

BEFORE (Lines 162-169):

```typescript
// Open form
fireEvent.click(screen.getByText(/new report/i));

// Fill in name
const input = screen.getByPlaceholderText(/report name/i);
fireEvent.change(input, { target: { value: 'New Report' } });

// Submit
fireEvent.click(screen.getByText(/^create$/i));
```

AFTER:

```typescript
const user = userEvent.setup();
// Open form
await user.click(screen.getByText(/new report/i));

// Fill in name
const input = screen.getByPlaceholderText(/report name/i);
await user.type(input, 'New Report');

// Submit
await user.click(screen.getByText(/^create$/i));
```

BEFORE (Lines 217, 222):

```typescript
fireEvent.click(screen.getByText(/new report/i));
// ...
fireEvent.change(input, { target: { value: '   ' } });
```

AFTER:

```typescript
const user = userEvent.setup();
await user.click(screen.getByText(/new report/i));
// ...
await user.type(input, '   ');
```

BEFORE (Lines 242-246):

```typescript
// Open form
fireEvent.click(screen.getByText(/new report/i));
expect(screen.getByPlaceholderText(/report name/i)).toBeInTheDocument();

// Click cancel
fireEvent.click(screen.getByText(/cancel/i));
```

AFTER:

```typescript
const user = userEvent.setup();
// Open form
await user.click(screen.getByText(/new report/i));
expect(screen.getByPlaceholderText(/report name/i)).toBeInTheDocument();

// Click cancel
await user.click(screen.getByText(/cancel/i));
```

All test signatures containing user interactions should be `async`:

```typescript
it('description', async () => {
  const user = userEvent.setup();
  // ...
});
```

### Fix #3: Add Missing Error Test (MEDIUM)

**Location:** After line 274, new describe block

ADD BEFORE FINAL CLOSING BRACE:

```typescript

  describe('Error handling', () => {
    it('should display error message when creation fails', () => {
      const mockCreate = jest.fn().mockRejectedValue(new Error('Failed'));

      mockUseReports.mockReturnValue({
        reports: [],
        isLoading: false,
        createReport: {
          mutateAsync: mockCreate,
          isPending: false,
          isError: true,
        } as any,
        updateReport: { mutateAsync: jest.fn() } as any,
        deleteReport: { mutateAsync: jest.fn() } as any,
      });

      render(<ReportList />);

      fireEvent.click(screen.getByText(/new report/i));

      expect(
        screen.getByText(/failed to create report/i)
      ).toBeInTheDocument();
    });
  });
```

---

## Summary by Priority

### CRITICAL (Must Fix) - 15 minutes

- [ ] DocumentList.test.tsx: Lines 26-40 (CSS test)
- [ ] ReportEditor.test.tsx: Lines 45-57 (CSS test)
- [ ] ReportList.test.tsx: Lines 25-42 (CSS test)

### HIGH (Should Fix) - 30 minutes

- [ ] DocumentList.test.tsx: Lines 130, 173 (fireEvent)
- [ ] ReportEditor.test.tsx: Lines 114, 156, 160 (fireEvent)
- [ ] ReportList.test.tsx: Lines 138, 162, 166, 169, 196, 217, 222, 243, 246 (fireEvent)

### MEDIUM (Nice to Have) - 45 minutes

- [ ] ReportEditor.test.tsx: Add save status tests (after line 200)
- [ ] ReportList.test.tsx: Add error handling test (after line 274)

### LOW (Bonus) - 5 minutes

- [ ] ReportEditor.test.tsx: Lines 82, 111 (getByTestId to getByRole)

**Total Time to Complete All:** ~90 minutes

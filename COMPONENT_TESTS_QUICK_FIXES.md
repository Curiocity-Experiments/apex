# Component Tests - Quick Fix Guide

**Date:** 2025-11-08  
**Impact:** 3 component test files with actionable improvements

---

## Red Flag Summary: 3 Critical Issues

### RED FLAG #1: CSS Class Testing (All 3 Components)

**Severity:** CRITICAL  
**Files:** DocumentList, ReportEditor, ReportList  
**Fix Time:** 15 minutes

#### The Problem

```typescript
// CURRENT - Tests implementation detail (CSS class)
const { container } = render(<DocumentList reportId={reportId} />);
const skeletons = container.querySelectorAll('.animate-pulse');
expect(skeletons.length).toBeGreaterThan(0);
```

#### Why It's Wrong

- Tests CSS class name, not what user sees
- Breaks if design system changes from `animate-pulse` to something else
- Doesn't verify loading indicator actually exists

#### The Fix

```typescript
// BETTER - Tests what user sees
render(<DocumentList reportId={reportId} />);
expect(screen.getByText(/loading|loading documents/i)).toBeInTheDocument();
```

**Apply to:**

1. `/home/user/apex/components/documents/__tests__/DocumentList.test.tsx` (lines 26-40)
2. `/home/user/apex/components/reports/__tests__/ReportEditor.test.tsx` (lines 45-57)
3. `/home/user/apex/components/reports/__tests__/ReportList.test.tsx` (lines 25-42)

---

### RED FLAG #2: Using fireEvent Instead of userEvent (All 3 Components)

**Severity:** HIGH  
**Files:** DocumentList, ReportEditor, ReportList  
**Fix Time:** 30 minutes

#### The Problem

```typescript
// CURRENT - Lower-level event simulation
fireEvent.click(deleteButton);
fireEvent.change(input, { target: { value: 'Text' } });
```

#### Why It's Wrong

- `fireEvent` doesn't simulate real user behavior
- Doesn't dispatch keyboard events properly
- Can miss edge cases that real users would find
- React Testing Library authors recommend against it

#### The Fix

```typescript
// BETTER - Realistic user simulation
const user = userEvent.setup();
await user.click(deleteButton);
await user.type(input, 'Text');
```

**Apply to:**

1. DocumentList.test.tsx (lines 130, 173)
2. ReportEditor.test.tsx (lines 114, 156, 160)
3. ReportList.test.tsx (lines 138, 162, 166, 169, 196, 217, 222, 243, 246)

---

### RED FLAG #3: Missing Error & Status Tests

**Severity:** MEDIUM  
**Files:** ReportEditor, ReportList  
**Fix Time:** 45 minutes

#### ReportEditor Missing Tests

The component displays save status text but it's never tested:

```typescript
// Component shows this (ReportEditor.tsx lines 56-70):
const getSaveStatus = () => {
  if (updateReport.isPending) {
    return <span className='text-sm text-gray-500'>Saving...</span>;  // NOT TESTED
  }
  if (updateReport.isError) {
    return <span className='text-sm text-red-600'>Error saving</span>;  // NOT TESTED
  }
  if (content !== debouncedContent) {
    return <span className='text-sm text-gray-400'>Unsaved changes</span>;  // NOT TESTED
  }
  return <span className='text-sm text-green-600'>All changes saved</span>;  // NOT TESTED
};
```

#### ReportList Missing Error Test

The component shows error alert but it's never tested:

```typescript
// Component shows this (ReportList.tsx lines 71-75):
{createReport.isError && (
  <p className='mt-2 text-sm text-red-600' role='alert'>
    Failed to create report. Please try again.
  </p>
)}
```

#### The Fix

Add to ReportEditor tests:

```typescript
describe('Save status feedback', () => {
  it('should show "Saving..." while saving', async () => {
    mockUpdateReport.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 500))
    );
    const user = userEvent.setup();
    render(<ReportEditor reportId='report-1' />);

    await user.type(screen.getByRole('textbox'), 'new');

    expect(screen.getByText(/saving/i)).toBeInTheDocument();
  });

  it('should show "All changes saved" after successful save', async () => {
    mockUpdateReport.mockResolvedValue({});
    jest.useFakeTimers();
    const user = userEvent.setup({ delay: null });
    render(<ReportEditor reportId='report-1' />);

    await user.type(screen.getByRole('textbox'), 'new');
    jest.advanceTimersByTime(1100);

    await waitFor(() => {
      expect(screen.getByText(/all changes saved/i)).toBeInTheDocument();
    });
  });
});
```

Add to ReportList tests:

```typescript
describe('Error handling', () => {
  it('should display error message when creation fails', () => {
    mockUseReports.mockReturnValue({
      reports: [],
      isLoading: false,
      createReport: {
        mutateAsync: jest.fn().mockRejectedValue(new Error('Failed')),
        isPending: false,
        isError: true,  // KEY: Error state
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

## Bonus Issues: Minor Improvements

### Issue #4: Using getByTestId for Editor (ReportEditor)

**Severity:** LOW  
**Files:** ReportEditor.test.tsx  
**Fix Time:** 5 minutes

#### Current Code

```typescript
const editor = screen.getByTestId('markdown-editor');
```

#### Better Approach

```typescript
// Try semantic query first
const editor = screen.getByRole('textbox');
// Or use placeholder text if component has it
const editor = screen.getByPlaceholderText(/start writing/i);
```

The mock SimpleMDE (lines 18-28) creates a textarea, which has `role="textbox"`, so either should work.

---

### Issue #5: Missing Accessibility Tests (All 3 Components)

**Severity:** LOW  
**Fix Time:** 60 minutes (can add incrementally)

#### Recommended Additions

For DocumentList - keyboard deletion:

```typescript
describe('Accessibility', () => {
  it('should delete with keyboard navigation', async () => {
    const user = userEvent.setup();
    mockUseDocuments.mockReturnValue({
      documents: [{
        id: 'doc-1',
        reportId,
        filename: 'test.pdf',
        fileHash: 'hash1',
        storagePath: '/storage/hash1.pdf',
        parsedContent: 'Content',
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }],
      isLoading: false,
      uploadDocument: { mutateAsync: jest.fn() } as any,
      updateDocument: { mutateAsync: jest.fn() } as any,
      deleteDocument: { mutateAsync: jest.fn() } as any,
    });

    render(<DocumentList reportId={reportId} />);

    // Tab to delete button
    await user.tab();
    expect(screen.getByRole('button', { name: /delete/i })).toHaveFocus();

    // Press Enter to open dialog
    await user.keyboard('{Enter}');

    // Verify dialog opened
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
```

For ReportList - escape to close form:

```typescript
describe('Accessibility', () => {
  it('should close create form with Escape key', async () => {
    const user = userEvent.setup();
    mockUseReports.mockReturnValue({
      reports: [],
      isLoading: false,
      createReport: { mutateAsync: jest.fn(), isPending: false } as any,
      updateReport: { mutateAsync: jest.fn() } as any,
      deleteReport: { mutateAsync: jest.fn() } as any,
    });

    render(<ReportList />);

    await user.click(screen.getByText(/new report/i));
    expect(screen.getByPlaceholderText(/report name/i)).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(
      screen.queryByPlaceholderText(/report name/i)
    ).not.toBeInTheDocument();
  });
});
```

---

## Implementation Roadmap

### Phase 1: Critical Fixes (30 minutes)

1. Fix CSS class loading tests (3 files) - 15 min
2. Replace fireEvent with userEvent (3 files) - 15 min

### Phase 2: Important Coverage (45 minutes)

1. Add error state tests - 15 min
2. Add save status tests - 30 min

### Phase 3: Nice to Have (60 minutes)

1. Add accessibility tests - 60 min

### Phase 4: Optimization (Optional)

1. Create testing helpers
2. Add edge case tests
3. Add performance tests

---

## Quick Command to Run Tests

```bash
# Run component tests only
npm test -- components/__tests__

# Run with coverage
npm test -- components/__tests__ --coverage

# Watch mode while fixing
npm test -- components/__tests__ --watch
```

---

## Key Takeaways

### ✅ DO

- Test user interactions (click, type, keyboard)
- Test what users see (text, visibility, role)
- Use `screen.getByRole()`, `screen.getByText()`
- Use `userEvent` for interactions
- Test callback execution (mutations being called)

### ❌ DON'T

- Test CSS classes
- Use `container.querySelector()`
- Use `fireEvent` for complex interactions
- Test component internals (state, hooks)
- Test implementation details

---

## Reference Files

- Full Analysis: `/home/user/apex/COMPONENT_TESTS_REVIEW.md`
- This Guide: `/home/user/apex/COMPONENT_TESTS_QUICK_FIXES.md`
- TDD Guide: `/home/user/apex/docs/TDD-GUIDE.md`
- Behavior vs Implementation: `/home/user/apex/docs/TDD-BEHAVIOR-VS-IMPLEMENTATION.md`

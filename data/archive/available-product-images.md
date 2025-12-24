# Available Product Images from Google Drive

**Source:** https://drive.google.com/drive/folders/1Hxuo_1bfzJTdr3o837-zYxr_bBqX2HhE

**Total Folders:** 45 product folders

## Product List (Model Codes)

1. A1
2. A5
3. A10-F
4. A10-M
5. AMA8
6. BM2
7. BM4
8. BM5
9. BM7
10. BM8
11. BO4
12. BO5
13. BO6
14. D2
15. D4
16. D21
17. DG1
18. DS10
19. G1
20. G5
21. HF3
22. HK-01
23. HK-02
24. K1
25. KS1
26. KS2
27. KS4
28. KS5
29. KS6
30. L10
31. LK-01
32. MK-02
33. MK-04
34. MK-05
35. N-110
36. NZ-2
37. PR20
38. PR21
39. PR22
40. PR24
41. PR25
42. PR26
43. SK5
44. SK12
45. SK22

## Notes

- Each folder contains multiple product images
- Images need to be downloaded and uploaded to S3
- Embeddings will be generated for visual search
- Missing products will be added by employees after launch

## Next Steps

1. Download images from each folder
2. Upload to S3 with proper naming (model_code/image_name.jpg)
3. Generate embeddings using OpenAI Vision API
4. Store embeddings in database
5. Create employee interface to upload missing product images

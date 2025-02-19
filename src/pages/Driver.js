import { filter } from 'lodash';
import { Icon } from '@iconify/react';
import { sentenceCase } from 'change-case';
import { useState, useEffect } from 'react';
import plusFill from '@iconify/icons-eva/plus-fill';
import { Link as RouterLink } from 'react-router-dom';
import moment from 'moment';
// material
import {
  Card,
  Table,
  Stack,
  Button,
  TableRow,
  TableBody,
  TableCell,
  Container,
  Typography,
  TableContainer,
  TablePagination
} from '@material-ui/core';
import firebase from '../firebase';
// components
import Page from '../components/Page';
import Label from '../components/Label';
import Scrollbar from '../components/Scrollbar';
import SearchNotFound from '../components/SearchNotFound';
import { UserListHead, UserListToolbar, UserMoreMenu } from '../components/_dashboard/user';
import { driverDataGet, driverDataSet } from '../utils/cache';
import ModalComponents from '../components/ModalComponents';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'name', label: 'Employee Name', alignRight: false },
  { id: 'email', label: 'Email', alignRight: false },
  { id: 'dobNumber', label: 'DOB', alignRight: false },
  { id: 'phone', label: 'Contact Number', alignRight: false },
  { id: 'regoNumber', label: 'Rego Number', alignRight: false },
  { id: 'licenseNumber', label: 'License Number', alignRight: false },
  { id: 'employeeType', label: 'Agreement', alignRight: false },
  { id: 'status', label: 'Status', alignRight: false },
  { id: '' }
];

// ----------------------------------------------------------------------

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function applySortFilter(array, comparator, query) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  if (query) {
    return filter(
      array,
      (_driver) => _driver.name.toLowerCase().indexOf(query.toLowerCase()) !== -1
    );
  }
  return stabilizedThis.map((el) => el[0]);
}

export default function Driver() {
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('asc');
  const [selected, setSelected] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [orderBy, setOrderBy] = useState('name');
  const [filterName, setFilterName] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [openModal, setOpenModal] = useState(false);
  const [uid, setUid] = useState('');

  useEffect(() => {
    firebase
      .firestore()
      .collection('drivers')
      .onSnapshot((snapshot) => {
        const newDriver = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setDrivers(newDriver);
      });
  }, []);

  if (drivers) {
    driverDataSet(drivers);
  }

  const deleteDriverEach = (id) => {
    setUid(id);
    setOpenModal(true);
  };

  const handleModalClose = () => {
    setOpenModal(false);
  };

  const deleteDriver = () => {
    const drivers = driverDataGet();
    const filteredDeleteDriver = drivers.filter((driver) => driver.id === uid)[0];
    firebase.firestore().collection('drivers').doc(filteredDeleteDriver.id).set({
      name: filteredDeleteDriver?.name,
      password: filteredDeleteDriver?.password,
      email: filteredDeleteDriver?.email,
      phone: filteredDeleteDriver?.phone,
      licenseNumber: filteredDeleteDriver?.licenseNumber,
      regoNumber: filteredDeleteDriver?.regoNumber,
      employeeType: filteredDeleteDriver?.employeeType,
      onWork: false,
      status: 'non-active'
    });
    setOpenModal(false);
  };

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = drivers?.map((n) => n.name);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterByName = (event) => {
    setFilterName(event.target.value);
  };

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - drivers?.length) : 0;

  const filteredDrivers = applySortFilter(drivers, getComparator(order, orderBy), filterName);

  const fillteredActiveDriver = filteredDrivers.filter((driver) => driver.status === 'active');

  const isUserNotFound = filteredDrivers.length === 0;

  return (
    <Page title="Driver | Minimal-UI">
      <Container maxWidth={false}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4" gutterBottom>
            Driver
          </Typography>
          <Button
            variant="contained"
            component={RouterLink}
            to="/dashboard/driver-manage?act=Add"
            startIcon={<Icon icon={plusFill} />}
          >
            New Driver
          </Button>
        </Stack>

        <Card>
          <UserListToolbar
            numSelected={selected.length}
            filterName={filterName}
            onFilterName={handleFilterByName}
          />

          <Scrollbar>
            <TableContainer sx={{ minWidth: 800 }}>
              <Table>
                <UserListHead
                  order={order}
                  orderBy={orderBy}
                  headLabel={TABLE_HEAD}
                  rowCount={drivers.length}
                  numSelected={selected.length}
                  onRequestSort={handleRequestSort}
                  onSelectAllClick={handleSelectAllClick}
                />
                <TableBody>
                  {fillteredActiveDriver
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row) => {
                      const {
                        id,
                        name,
                        email,
                        phone,
                        dobNumber,
                        regoNumber,
                        licenseNumber,
                        employeeType,
                        status
                      } = row;
                      const isItemSelected = selected.indexOf(name) !== -1;

                      return (
                        <TableRow
                          hover
                          key={id}
                          tabIndex={-1}
                          role="checkbox"
                          selected={isItemSelected}
                          aria-checked={isItemSelected}
                        >
                          <TableCell padding="checkbox" />
                          <TableCell component="th" scope="row" padding="none">
                            <RouterLink
                              to={`/dashboard/driver-manage?act=Edit&id=${id}`}
                              style={{ textDecoration: 'none', color: '#000' }}
                            >
                              <Stack direction="row" alignItems="center" spacing={2}>
                                <Typography variant="subtitle2" noWrap>
                                  {name}
                                </Typography>
                              </Stack>
                            </RouterLink>
                          </TableCell>
                          <TableCell align="left">{email}</TableCell>
                          <TableCell align="left">
                            {moment(dobNumber).format('DD-MM-YYYY')}
                          </TableCell>
                          <TableCell align="left">{phone}</TableCell>
                          <TableCell align="left">{regoNumber}</TableCell>
                          <TableCell align="left">{licenseNumber}</TableCell>
                          <TableCell align="left">
                            {employeeType === 2 && 'Terminate'}
                            {employeeType === 1 && 'Permanent'}
                            {employeeType === 0 && 'Part Time'}
                          </TableCell>
                          <TableCell align="left">
                            <Label
                              variant="ghost"
                              color={(status === 'banned' && 'error') || 'success'}
                            >
                              {sentenceCase(status)}
                            </Label>
                          </TableCell>

                          <TableCell align="right">
                            <UserMoreMenu
                              deleteFunction={() => deleteDriverEach(id)}
                              linkEdit={`/dashboard/driver-manage?act=Edit&id=${id}`}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  {emptyRows > 0 && (
                    <TableRow style={{ height: 53 * emptyRows }}>
                      <TableCell colSpan={6} />
                    </TableRow>
                  )}
                </TableBody>
                {isUserNotFound && (
                  <TableBody>
                    <TableRow>
                      <TableCell align="center" colSpan={6} sx={{ py: 3 }}>
                        <SearchNotFound searchQuery={filterName} />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                )}
              </Table>
            </TableContainer>
            <ModalComponents
              title="Delete"
              message="Are you sure you wish to delete this driver?"
              open={openModal}
              handleSubmit={deleteDriver}
              handleClose={handleModalClose}
            />
          </Scrollbar>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={drivers.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Card>
      </Container>
    </Page>
  );
}
